package org.activiti.bpmn.converter.alfresco;

import org.activiti.bpmn.converter.FormPropertiesTaskXMLConverter;
import org.activiti.bpmn.model.BaseElement;
import org.activiti.bpmn.model.alfresco.AlfrescoFormPropertiesTask;

/**
 * Created by sagari on 19-Aug-16.
 */
public class AlfrescoFormPropertiesTaskXMLConverter extends FormPropertiesTaskXMLConverter{
    public Class<? extends BaseElement> getBpmnElementType() {
        return AlfrescoFormPropertiesTask.class;
    }

    @Override
    protected String getXMLElementName() {
        return ELEMENT_FORM_PROPERTIES_TASK_USER;
    }
}
