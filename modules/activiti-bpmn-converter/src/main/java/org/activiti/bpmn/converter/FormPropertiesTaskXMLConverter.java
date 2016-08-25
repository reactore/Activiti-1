package org.activiti.bpmn.converter;

import org.activiti.bpmn.converter.BaseBpmnXMLConverter;
import org.activiti.bpmn.converter.child.BaseChildElementParser;
import org.activiti.bpmn.converter.util.BpmnXMLUtil;
import org.activiti.bpmn.model.*;
import org.activiti.bpmn.model.alfresco.AlfrescoFormPropertiesTask;
import org.apache.commons.lang3.StringUtils;

import javax.xml.stream.XMLStreamReader;
import javax.xml.stream.XMLStreamWriter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by sagari on 19-Aug-16.
 */
public class FormPropertiesTaskXMLConverter extends BaseBpmnXMLConverter {

    protected Map<String, BaseChildElementParser> childParserMap = new HashMap<String, BaseChildElementParser>();

    /**
     * default attributes taken from bpmn spec and from activiti extension
     */
    protected static final List<ExtensionAttribute> defaultFormPropertiesTaskAttributes = Arrays.asList(
            new ExtensionAttribute(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_FORM_FORMKEY),
            new ExtensionAttribute(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_USER_BUSINESS_CALENDAR_NAME),
            new ExtensionAttribute(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_USER_CATEGORY),
            new ExtensionAttribute(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_SERVICE_EXTENSIONID),
            new ExtensionAttribute(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_USER_SKIP_EXPRESSION)
    );

    @Override
    public Class<? extends BaseElement> getBpmnElementType() {
        return FormPropertiesTask.class;
    }

    @Override
    protected String getXMLElementName() {
        return ELEMENT_FORM_PROPERTIES_TASK_USER;
    }

    @Override
    @SuppressWarnings("unchecked")
    protected BaseElement convertXMLToElement(XMLStreamReader xtr, BpmnModel model) throws Exception {
        String formKey = xtr.getAttributeValue(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_FORM_FORMKEY);
        FormPropertiesTask formPropertiesTask = null;
        if (StringUtils.isNotEmpty(formKey)) {
            if (model.getFormPropertiesTaskFormTypes() != null && model.getFormPropertiesTaskFormTypes().contains(formKey)) {
                formPropertiesTask = new AlfrescoFormPropertiesTask();
            }
        }

        if (formPropertiesTask == null) {
            formPropertiesTask = new FormPropertiesTask();
        }
        BpmnXMLUtil.addXMLLocation(formPropertiesTask, xtr);
        formPropertiesTask.setBusinessCalendarName(xtr.getAttributeValue(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_USER_BUSINESS_CALENDAR_NAME));
        formPropertiesTask.setCategory(xtr.getAttributeValue(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_USER_CATEGORY));
        formPropertiesTask.setFormKey(formKey);
        formPropertiesTask.setExtensionId(xtr.getAttributeValue(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_SERVICE_EXTENSIONID));
        if (StringUtils.isNotEmpty(xtr.getAttributeValue(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_USER_SKIP_EXPRESSION))) {
            String expression = xtr.getAttributeValue(ACTIVITI_EXTENSIONS_NAMESPACE, ATTRIBUTE_TASK_USER_SKIP_EXPRESSION);
            formPropertiesTask.setSkipExpression(expression);
        }
        BpmnXMLUtil.addCustomAttributes(xtr, formPropertiesTask, defaultElementAttributes,
                defaultActivityAttributes, defaultFormPropertiesTaskAttributes);
        parseChildElements(getXMLElementName(), formPropertiesTask, childParserMap, model, xtr);
        return formPropertiesTask;
    }

    @Override
    @SuppressWarnings("unchecked")
    protected void writeAdditionalAttributes(BaseElement element, BpmnModel model, XMLStreamWriter xtw) throws Exception {
        FormPropertiesTask formPropertiesTask = (FormPropertiesTask) element;
        writeQualifiedAttribute(ATTRIBUTE_TASK_USER_BUSINESS_CALENDAR_NAME, formPropertiesTask.getBusinessCalendarName(), xtw);
        writeQualifiedAttribute(ATTRIBUTE_TASK_USER_CATEGORY, formPropertiesTask.getCategory(), xtw);
        writeQualifiedAttribute(ATTRIBUTE_FORM_FORMKEY, formPropertiesTask.getFormKey(), xtw);
        if (StringUtils.isNotEmpty(formPropertiesTask.getExtensionId())) {
            writeQualifiedAttribute(ATTRIBUTE_TASK_SERVICE_EXTENSIONID, formPropertiesTask.getExtensionId(), xtw);
        }
        if (formPropertiesTask.getSkipExpression() != null) {
            writeQualifiedAttribute(ATTRIBUTE_TASK_USER_SKIP_EXPRESSION, formPropertiesTask.getSkipExpression(), xtw);
        }
        // write custom attributes
        BpmnXMLUtil.writeCustomAttributes(formPropertiesTask.getAttributes().values(), xtw, defaultElementAttributes,
                defaultActivityAttributes, defaultFormPropertiesTaskAttributes);
    }

    @Override
    @SuppressWarnings("unchecked")
    protected boolean writeExtensionChildElements(BaseElement element, boolean didWriteExtensionStartElement, XMLStreamWriter xtw) throws Exception {
        FormPropertiesTask formPropertiesTask = (FormPropertiesTask) element;
        didWriteExtensionStartElement = writeFormProperties(formPropertiesTask, didWriteExtensionStartElement, xtw);
        didWriteExtensionStartElement = writeCustomIdentities(didWriteExtensionStartElement, xtw);
        if (!formPropertiesTask.getCustomProperties().isEmpty()) {
            for (CustomProperty customProperty : formPropertiesTask.getCustomProperties()) {
                if (StringUtils.isEmpty(customProperty.getSimpleValue())) {
                    continue;
                }
                if (didWriteExtensionStartElement == false) {
                    xtw.writeStartElement(ELEMENT_EXTENSIONS);
                    didWriteExtensionStartElement = true;
                }
                xtw.writeStartElement(ACTIVITI_EXTENSIONS_PREFIX, customProperty.getName(), ACTIVITI_EXTENSIONS_NAMESPACE);
                xtw.writeCData(customProperty.getSimpleValue());
                xtw.writeEndElement();
            }
        }
        return didWriteExtensionStartElement;
    }

    protected boolean writeCustomIdentities(boolean didWriteExtensionStartElement, XMLStreamWriter xtw) throws Exception {
        if (didWriteExtensionStartElement == false) {
            xtw.writeStartElement(ELEMENT_EXTENSIONS);
            didWriteExtensionStartElement = true;
        }
        return didWriteExtensionStartElement;
    }

    @Override
    protected void writeAdditionalChildElements(BaseElement element, BpmnModel model, XMLStreamWriter xtw) throws Exception {

    }
}
