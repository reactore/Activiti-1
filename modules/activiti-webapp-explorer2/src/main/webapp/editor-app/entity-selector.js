'use strict';

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const COMMON_SERVER_URL = "http://192.168.1.165:90/common/";
const WORKFLOW_SERVER_URL = "http://192.168.1.165:90/workflow/";
// const ASSET_SERVER_URL = "http://192.168.1.165:90/asset/";
// const AT_SERVER_URL = "http://192.168.1.165:90/at/";
// const BUDGET_SERVER_URL = "http://192.168.1.165:90/budget/";
// const HR_SERVER_URL = "http://192.168.1.165:90/hr/";
// const HS_SERVER_URL = "http://192.168.1.165:90/hs/";
// const PRODUCTION_SERVER_URL = "http://192.168.1.165:90/production/";
// const PROCESSING_SERVER_URL = "http://192.168.1.165:90/processing/";
// const SD_SERVER_URL = "http://192.168.1.165/sd/";
const MAGIC_STRINGS = { MODULES: "modules", MODULES_METADATA: "moduleDeployments", ENTITY_TYPES: "entityTypes" };
const API_CONTEXT_ROUTES = { MODULES: "modules", ENTITY_TYPES: "entityTypes/moduleId/", SERVICE_REGISTRY: "serviceRegistry/module/" };

angular.module('activitiModeler')
    .run(["$http", bootstrap])
    .service('rtEntityCacheApi', [rtEntityCacheApi])
    .service('rtEntitySelectorApi', ["$http", "$q", "rtEntityCacheApi", rtEntitySelectorApi])
    .directive('rtEntitySelector', ["rtEntitySelectorApi", rtEntitySelector])
    .directive('rtEntityApiSelector', ["rtEntitySelectorApi", rtEntityApiSelector]);

function bootstrap($http) {
    var apiKey = getParameterByName("apiKey");
    $http.defaults.headers.common.apiKey = apiKey;
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
            $http.get(COMMON_SERVER_URL + API_CONTEXT_ROUTES.MODULES).success(function (response) {
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
            var url = COMMON_SERVER_URL + "moduleDeployments";
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
            var url = COMMON_SERVER_URL + API_CONTEXT_ROUTES.ENTITY_TYPES + moduleId;
            $http.get(url).success(function (response) {
                rtEntityCacheApi.insertModuleEntityTypesIntoCache(moduleId, response);
                deferred.resolve(response);
            }).error(function (error) {
                deferred.reject(error);
            });
        }
        return deferred.promise;
    };

    this.getEntityApis = function (moduleId, entityTypeId) {
        var deferred = $q.defer();
        var url = WORKFLOW_SERVER_URL + API_CONTEXT_ROUTES.SERVICE_REGISTRY + moduleId + "/entityType/" + entityTypeId;
        $http.get(url).success(function (response) {
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
        '<option value="{{entityType.id}}" ng-selected="selectedEntityTypeId==entityType.id" ng-repeat="entityType in entityTypes">{{entityType.name}}</option>' +
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

function rtEntityApiSelector(rtEntitySelectorApi) {
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
        '<option value="{{entityType.id}}" ng-selected="selectedEntityTypeId==entityType.id" ng-repeat="entityType in entityTypes">{{entityType.name}}</option>' +
        '</select></div>' +
        '<div class="form-group">' +
        '<label for="api">Api</label>' +
        '<select id="api" class="form-control" ng-model="selectedApiId" ng-change="apiChanged()" ng-disabled="selectedEntityTypeId==null">' +
        '<option value="">-- choose Api --</option>' +
        '<option value="{{api.id}}" ng-selected="selectedApiId==api.id" ng-repeat="api in apis">{{api.friendlyApiName}}</option>' +
        '</select></div>';

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
        function loadApis(moduleId, entityTypeId) {
            rtEntitySelectorApi.getEntityApis(moduleId, entityTypeId).then(function (data) {
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
            console.log("Selected api changed " + scope.selectedApiId);
        };
        init();
    }
    return {
        restrict: 'E',
        scope: {
            selectedModuleId: '=',
            selectedEntityTypeId: '=',
            selectedApiId: '='
        },
        template: apiSelectorTemplate,
        link: link
    };
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