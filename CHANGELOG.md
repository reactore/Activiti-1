Customisation of [Activiti](http://activiti.org/) BPM [source code](https://github.com/Activiti/Activiti) for [Reactore](http://reactore.com/)
==============================================================================================================================================
1.	Added new file entity-selector.js in modules\activiti-webapp-explorer2\src\main\webapp\editor-app folder to extend the field types to have entity and api selectors. This file has implementation of custom directives to chose entities and api's
2.  Added script reference to entity-selector.js file modules\activiti-webapp-explorer2\src\main\webapp\modeler.html just below app.js reference
3.  Modified form-properties-popup.html to have options for entity and api in filed type selector.
4.  Added ACTIVITI.REACTORE_CONFIG object to have reactore specific app settings in app-cfg.js which is located in modules\activiti-webapp-explorer2\src\main\webapp\editor-app
5.  Injected rtEventsService into KisBpmFormPropertiesPopupCtrl (properties-form-properties-controller.js) for listening to selected rest api params, which will be added as variables automatically
6.  Added condition to set default service task class name in StencilController (stencil-controller.js)
