'use strict';

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const MAGIC_STRINGS = { MODULES: "modules", MODULES_METADATA: "moduleDeployments", ENTITY_TYPES: "entityTypes" };
const API_CONTEXT_ROUTES = {
    MODULES: "modules", ENTITY_TYPES: "entityTypes/moduleId/", SERVICE_REGISTRY: "serviceRegistries/", SERVICE_REGISTRY_MODULE: "serviceRegistry/module/",
    UPDATE_MODEL: "updateModel", SERVICE_UUID: "serviceUUID"
};

angular.module('activitiModeler')
    .run(["$http", bootstrap])
    .service('rtEventsService', ["$q", "$rootScope", rtEventsService])
    .service('rtEntityCacheApi', [rtEntityCacheApi])
    .service('rtEntitySelectorApi', ["$http", "$q", "rtEntityCacheApi", rtEntitySelectorApi])
    .service('rtWorkflowApi', ["$http", "$q", rtWorkflowApi])
    .directive('rtEntitySelector', ["rtEntitySelectorApi", rtEntitySelector])
    .directive('rtEntityApiSelector', ["rtEntitySelectorApi", "rtEventsService", rtEntityApiSelector])
    .directive('rtApiViewer', ["rtEntitySelectorApi", rtApiViewer]);

function bootstrap($http) {
    var apiKey = getParameterByName("apiKey");
    $http.defaults.headers.common.apiKey = apiKey;
}

function rtEventsService($q, $rootScope) {
    return {
        publish: function (name, args) {
            if (!$rootScope.$$listeners[name]) {
                return new Array();
            }
            var deferred = new Array();
            for (var i = 0; i < $rootScope.$$listeners[name].length; i++) {
                deferred.push($q.defer());
            }
            var eventArgs = {
                args: args,
                reject: function (a) {
                    deferred.pop().reject(a);
                },
                resolve: function (a) {
                    deferred.pop().resolve(a);
                }
            };
            $rootScope.$broadcast(name, eventArgs);
            var promises = deferred.map(function (p) {
                return p.promise;
            });
            return promises;
        },
        subscribe: function (name, callback) {
            return $rootScope.$on(name, callback);
        },
        unsubscribe: function (handle) {
            if (angular.isFunction(handle)) {
                handle();
            }
        }
    };
}

function rtEntityCacheApi() {
    var cache = [];

    this.getModulesFromCache = function () {
        return cache.filter(function (cacheItem) {
            return cacheItem.key === MAGIC_STRINGS.MODULES;
        })
    };

    this.getModulesMetadataFromCache = function () {
        return cache.filter(function (cacheItem) {
            return cacheItem.key === MAGIC_STRINGS.MODULES_METADATA;
        })
    };

    function getEntityTypesFromCache() {
        return cache.filter(function (cacheItem) {
            return cacheItem.key === MAGIC_STRINGS.ENTITY_TYPES;
        });
    };

    this.getEntityTypesFromCache = function (moduleId) {
        var moduleEntityTypes = getEntityTypesFromCache();
        if (moduleEntityTypes && moduleEntityTypes.length > 0) {
            return moduleEntityTypes[0].value.filter(function (moduleEntityType) {
                return moduleEntityType.moduleId === moduleId;
            });
        }
    };

    this.insertIntoCache = function (key, value) {
        cache.push({ key: key, value: value });
    };

    this.insertModuleEntityTypesIntoCache = function (moduleId, moduleEntityTypes) {
        var moduleEntityTypesFromCache = getEntityTypesFromCache();
        var moduleEntityTypesMap = { moduleId: moduleId, entityTypes: moduleEntityTypes };
        if (moduleEntityTypesFromCache && moduleEntityTypesFromCache.length > 0) {
            moduleEntityTypesFromCache[0].value.push(moduleEntityTypesMap)
        } else {
            this.insertIntoCache(MAGIC_STRINGS.ENTITY_TYPES, [moduleEntityTypesMap]);
        }
    };

}

function rtEntitySelectorApi($http, $q, rtEntityCacheApi) {
    this.modules;
    this.allEntityTypes;
    this.allApis;

    this.getModules = function () {
        var deferred = $q.defer();
        var modulesFromCache = rtEntityCacheApi.getModulesFromCache();
        if (modulesFromCache && modulesFromCache.length > 0) {
            deferred.resolve(modulesFromCache[0].value);
        } else {
            var url = ACTIVITI.REACTORE_CONFIG.COMMON_SERVER_URL + API_CONTEXT_ROUTES.MODULES;
            $http.get(url).success(function (response) {
                rtEntityCacheApi.insertIntoCache(MAGIC_STRINGS.MODULES, response);
                deferred.resolve(response);
            }).error(function (error) {
                deferred.reject(error);
            });
        }
        return deferred.promise;
    }

    this.getModulesMetadata = function () {
        var deferred = $q.defer();
        var modulesMetadataFromCache = rtEntityCacheApi.getModulesMetadataFromCache();
        if (modulesMetadataFromCache && modulesMetadataFromCache.length > 0) {
            deferred.resolve(modulesMetadataFromCache[0].value);
        } else {
            var url = ACTIVITI.REACTORE_CONFIG.COMMON_SERVER_URL + "moduleDeployments";
            $http.get(url).success(function (response) {
                rtEntityCacheApi.insertIntoCache(MAGIC_STRINGS.MODULES_METADATA, response);
                deferred.resolve(response);
            }).error(function (error) {
                deferred.reject(error);
            });
        }
        return deferred.promise;
    }

    this.getEntityTypes = function (moduleId) {
        var deferred = $q.defer();
        var moduleEntityTypesFromCache = rtEntityCacheApi.getEntityTypesFromCache(moduleId);
        if (moduleEntityTypesFromCache && moduleEntityTypesFromCache.length > 0) {
            deferred.resolve(moduleEntityTypesFromCache[0].entityTypes);
        } else {
            var url = ACTIVITI.REACTORE_CONFIG.COMMON_SERVER_URL + API_CONTEXT_ROUTES.ENTITY_TYPES + moduleId;
            $http.get(url).success(function (response) {
                rtEntityCacheApi.insertModuleEntityTypesIntoCache(moduleId, response);
                deferred.resolve(response);
            }).error(function (error) {
                deferred.reject(error);
            });
        }
        return deferred.promise;
    };

    this.getEntityApis = function (moduleId, entityTypeName) {
        var deferred = $q.defer();
        var url = ACTIVITI.REACTORE_CONFIG.COMMON_SERVER_URL + API_CONTEXT_ROUTES.SERVICE_REGISTRY + "registryByEntityType";
        var entity = { "moduleId": parseInt(moduleId), "entityTypeName": entityTypeName };
        $http.post(url, entity).success(function (response) {
            deferred.resolve(response);
        }).error(function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };

    this.getApiDetails = function (apiId) {
        var deferred = $q.defer();
        var url = ACTIVITI.REACTORE_CONFIG.COMMON_SERVER_URL + API_CONTEXT_ROUTES.SERVICE_REGISTRY + API_CONTEXT_ROUTES.SERVICE_UUID;
        $http.post(url, { "serviceUUID": apiId }).success(function (response) {
            deferred.resolve(response);
        }).error(function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };

    function getApiNameFromModulesMetadata(modulesMetadata, entityType) {
        var moduleUrl = modulesMetadata.filter(function (modulesMetadata) {
            return modulesMetadata.moduleId == entityType.moduleId;
        })[0].serverUrl;
        return moduleUrl + entityType.basePath;
    }

    this.getApiName = function (entityType) {
        var deferred = $q.defer();
        this.getModulesMetadata().then(function (data) {
            var apiName = getApiNameFromModulesMetadata(data, entityType);
            deferred.resolve(apiName);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    this.getEntities = function (entityType) {
        var deferred = $q.defer();
        this.getApiName(entityType).then(function (data) {
            $http.get(data).success(function (response) {
                deferred.resolve(response);
            }).error(function (error) {
                deferred.reject(error);
            });
        }, function (error) {
            deferred.reject(error);
            console.log("Error loading entities " + error);
        });
        return deferred.promise;
    };
}

function rtWorkflowApi($http, $q) {
    this.updateModel = function (modelerId) {
        var deferred = $q.defer();
        var url = ACTIVITI.REACTORE_CONFIG.WORKFLOW_SERVER_URL + API_CONTEXT_ROUTES.UPDATE_MODEL;
        $http.post(url, { "modelerId": parseInt(modelerId) }).success(function (response) {
            deferred.resolve(response);
        }).error(function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }
}

function rtEntitySelector(rtEntitySelectorApi) {
    var entitySelectorTemplate = '<div class="form-group">' +
        '<label for="module">Module</label>' +
        '<select id="module" class="form-control" ng-model="selectedModuleId" ng-change="moduleChanged()">' +
        '<option value="">-- choose module--</option>' +
        '<option value="{{module.id}}" ng-selected="selectedModuleId==module.id" ng-repeat="module in modules">{{module.name}}</option>' +
        '</select></div>' +
        '<div class="form-group">' +
        '<label for="entityType">Entity type</label>' +
        '<select id="entityType" class="form-control" ng-model="selectedEntityTypeId" ng-change="entityTypeChanged()" ng-disabled="selectedModuleId==null">' +
        '<option value="">-- choose entity type--</option>' +
        '<option value="{{entityType.name}}" ng-selected="selectedEntityTypeId==entityType.name" ng-repeat="entityType in entityTypes">{{entityType.name}}</option>' +
        '</select></div>' +
        '<div class="form-group">' +
        '<label for="entity">Entity</label>' +
        '<select id="entity" class="form-control" ng-model="selectedEntityId" ng-change="entityChanged()" ng-disabled="selectedEntityTypeId==null">' +
        '<option value="">-- choose entity --</option>' +
        '<option value="{{entity.id}}" ng-selected="selectedEntityId==entity.id" ng-repeat="entity in entities">{{entity.name}}</option>' +
        '</select></div>';

    function link(scope, element, attrs) {
        function getEntityType(selectedEntityTypeId) {
            return scope.entityTypes.filter(function (entityType) {
                return entityType.id == selectedEntityTypeId;
            })[0];
        }
        function loadModules() {
            rtEntitySelectorApi.getModules().then(function (data) {
                scope.modules = data;
                if (scope.selectedModuleId) {
                    loadEntityTypes(scope.selectedModuleId);
                }
            }, function (error) {
                console.log("Error occured during get modules");
            });
        }
        function loadEntityTypes(moduleId) {
            rtEntitySelectorApi.getEntityTypes(moduleId).then(function (data) {
                scope.entityTypes = data;
                if (scope.selectedEntityTypeId) {
                    loadEntities(scope.selectedEntityTypeId);
                }
            }, function (error) {
                console.log("Error occured during get entity types");
            });
        }
        function loadEntities(entityTypeId) {
            var entityType = getEntityType(scope.selectedEntityTypeId);
            rtEntitySelectorApi.getEntities(entityType).then(function (data) {
                scope.entities = data;
            }, function (error) {
                console.log("Error loading entities");
            });
        }
        function init() {
            loadModules();
        }
        function clearPreviousModuleData() {
            scope.entityTypes = [];
            scope.selectedEntityTypeId = undefined;
            clearPreviousEntityTypeData();
        }
        function clearPreviousEntityTypeData() {
            scope.entities = [];
            scope.selectedEntityId = undefined;
        }
        scope.moduleChanged = function () {
            if (scope.selectedModuleId) {
                loadEntityTypes(scope.selectedModuleId);
                clearPreviousModuleData();
            }
        };
        scope.entityTypeChanged = function () {
            if (scope.selectedModuleId && scope.selectedEntityTypeId) {
                loadEntities(scope.selectedEntityTypeId);
                clearPreviousEntityTypeData();
            }
        };
        scope.entityChanged = function () {
            console.log("Selected entity changed " + scope.selectedEntityId);
        };
        init();
    }
    return {
        restrict: 'E',
        scope: {
            selectedModuleId: '=',
            selectedEntityTypeId: '=',
            selectedEntityId: '='
        },
        template: entitySelectorTemplate,
        link: link
    };
}

function rtEntityApiSelector(rtEntitySelectorApi, rtEventsService) {
    var apiSelectorTemplate = '<div class="form-group">' +
        '<label for="module">Module</label>' +
        '<select id="module" class="form-control" ng-model="selectedModuleId" ng-change="moduleChanged()">' +
        '<option value="">-- choose module--</option>' +
        '<option value="{{module.id}}" ng-selected="selectedModuleId==module.id" ng-repeat="module in modules">{{module.name}}</option>' +
        '</select></div>' +
        '<div class="form-group">' +
        '<label for="entityType">Entity type</label>' +
        '<select id="entityType" class="form-control" ng-model="selectedEntityTypeId" ng-change="entityTypeChanged()" ng-disabled="selectedModuleId==null">' +
        '<option value="">-- choose entity type--</option>' +
        '<option value="{{entityType.name}}" ng-selected="selectedEntityTypeId==entityType.name" ng-repeat="entityType in entityTypes">{{entityType.name}}</option>' +
        '</select></div>' +
        '<div class="form-group">' +
        '<label for="api">Api</label>' +
        '<select id="api" class="form-control" ng-model="selectedApiId" ng-change="apiChanged()" ng-disabled="selectedEntityTypeId==null">' +
        '<option value="">-- choose Api --</option>' +
        '<option value="{{api.serviceUUID}}" ng-selected="selectedApiId==api.serviceUUID" ng-repeat="api in apis">{{api.friendlyApiName}}</option>' +
        '</select></div>' +
        '<div data-ng-if="selectedApiId" class="form-group">' +
        '<label for="url">Api details:</label>' +
        '<rt-api-viewer api-id="selectedApiId"></rt-api-viewer>' +
        '</div>';

    function link(scope, element, attrs) {
        function getApiNameForEntityType(selectedEntityTypeId) {
            return scope.entityTypes.filter(function (entityType) {
                return entityType.id == selectedEntityTypeId;
            })[0].api;
        }
        function loadModules() {
            rtEntitySelectorApi.getModules().then(function (data) {
                scope.modules = data;
                if (scope.selectedModuleId) {
                    loadEntityTypes(scope.selectedModuleId);
                }
            }, function (error) {
                console.log("Error occured during get modules");
            });
        }
        function loadEntityTypes(moduleId) {
            rtEntitySelectorApi.getEntityTypes(moduleId).then(function (data) {
                scope.entityTypes = data;
                if (scope.selectedEntityTypeId) {
                    loadApis(moduleId, scope.selectedEntityTypeId);
                }
            }, function (error) {
                console.log("Error occured during get entity types");
            });
        }
        function loadApis(moduleId, entityTypeName) {
            rtEntitySelectorApi.getEntityApis(moduleId, entityTypeName).then(function (data) {
                scope.apis = data;
            }, function (error) {
                console.log("Error loading entities");
            });
        }
        function init() {
            loadModules();
        }

        function clearPreviousModuleData() {
            scope.entityTypes = [];
            scope.selectedEntityTypeId = undefined;
            clearPreviousEntityTypeData();
        }
        function clearPreviousEntityTypeData() {
            scope.apis = [];
            scope.selectedApiId = undefined;
        }
        scope.moduleChanged = function () {
            if (scope.selectedModuleId) {
                loadEntityTypes(scope.selectedModuleId);
                clearPreviousModuleData();
            }
        };

        scope.entityTypeChanged = function () {
            if (scope.selectedModuleId && scope.selectedEntityTypeId) {
                loadApis(scope.selectedModuleId, scope.selectedEntityTypeId);
                clearPreviousEntityTypeData();
            }
        };
        scope.apiChanged = function () {
            if (scope.selectedApiId) {
                console.log("Selected api changed " + scope.selectedApiId);
                var newApi = scope.apis.filter(function (selectedApi) {
                    return selectedApi.serviceUUID == scope.selectedApiId;
                })[0];
                var url = newApi.url;
                var params = url.match(/[^{}]+(?=\})/g);
                rtEventsService.publish("onApiSelected", { params: params, formPropertyId: scope.formPropertyId });
            }
        };
        init();
    }
    return {
        restrict: 'E',
        scope: {
            selectedModuleId: '=',
            selectedEntityTypeId: '=',
            selectedApiId: '=',
            formPropertyId: '='
        },
        template: apiSelectorTemplate,
        link: link
    };
}

function rtApiViewer(rtEntitySelectorApi) {
    var apiViewerTemplate = '<div class="form-group">' +
        '<label for="url">URL:</label>' +
        '<label for="url">{{entityDetails.url}}</label>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="url">Request type:</label>' +
        '<label for="url">{{entityDetails.httpRequestType}}</label>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="url">Payload:</label>' +
        '<label for="url">{{entityDetails.payload}}</label>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="url">Output:</label>' +
        '<label for="url">{{entityDetails.output}}</label>' +
        '</div>';
    return {
        restrict: 'E',
        scope: {
            apiId: '='
        },
        template: apiViewerTemplate,
        link: link
    };
    function link(scope, element, attrs) {
        function loadApiDetails(apiId) {
            rtEntitySelectorApi.getApiDetails(apiId).then(function (data) {
                scope.entityDetails = data;
            }, function (error) {
                console.log("Error occured during get api details");
            });
        }
        function init() {
            loadApiDetails(scope.apiId);
        }
        scope.$watch("apiId", onApiIdChange);
        function onApiIdChange(newValue, oldValue) {
            if (newValue != null && newValue !== undefined) {
                loadApiDetails(newValue);
            }
        }
        //init();
    }
}

function rtEntitySelectorMockApi($http, $q) {
    var entityTypes = [{ id: 1, name: "Employee", api: "employees" }, { id: 2, name: "Department", api: "departments" }];
    var employees = [{ id: 1, name: "Julian" }, { id: 2, name: "Craig" }, { id: 3, name: "Jerry" }];
    var departments = [{ id: 1, name: "HR" }, { id: 2, name: "Admin" }, { id: 3, name: "Mining" }];
    var modules = [{ id: 1, name: "HR" }, { id: 2, name: "Production" }, { id: 3, name: "Assets" }, { id: 4, name: "Budget" }, { id: 5, name: "Processing" }, { id: 6, name: "Health and Safety" }];
    this.getEntityTypes = function () {
        var deferred = $q.defer();
        setTimeout(function () {
            deferred.resolve(entityTypes);
        }, 1000);
        return deferred.promise;
    };
    this.getEntities = function (api) {
        var deferred = $q.defer();
        setTimeout(function () {
            if (api == "employees")
                deferred.resolve(employees);
            else
                deferred.resolve(departments);
        }, 1000);
        return deferred.promise;
    };
    this.getModules = function () {
        var deferred = $q.defer();
        setTimeout(function () {
            deferred.resolve(modules);
        }, 1000);
        return deferred.promise;
    };
}