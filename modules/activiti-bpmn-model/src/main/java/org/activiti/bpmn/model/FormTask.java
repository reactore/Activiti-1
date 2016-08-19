package org.activiti.bpmn.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by sagari on 18-Aug-16.
 */
public class FormTask extends Task {

    protected String formKey;
    protected String businessCalendarName;
    protected String category;
    protected String extensionId;
    protected List<FormProperty> formProperties = new ArrayList<FormProperty>();
    protected List<ActivitiListener> taskListeners = new ArrayList<ActivitiListener>();
    protected String skipExpression;
    protected List<CustomProperty> customProperties = new ArrayList<CustomProperty>();


    public String getFormKey() {
        return formKey;
    }

    public void setFormKey(String formKey) {
        this.formKey = formKey;
    }

    public String getExtensionId() {
        return extensionId;
    }

    public void setExtensionId(String extensionId) {
        this.extensionId = extensionId;
    }

    public boolean isExtended() {
        return extensionId != null && !extensionId.isEmpty();
    }

    public List<FormProperty> getFormProperties() {
        return formProperties;
    }

    public void setFormProperties(List<FormProperty> formProperties) {
        this.formProperties = formProperties;
    }

    public List<ActivitiListener> getTaskListeners() {
        return taskListeners;
    }

    public void setTaskListeners(List<ActivitiListener> taskListeners) {
        this.taskListeners = taskListeners;
    }

    public List<CustomProperty> getCustomProperties() {
        return customProperties;
    }

    public void setCustomProperties(List<CustomProperty> customProperties) {
        this.customProperties = customProperties;
    }

    public String getSkipExpression() {
        return skipExpression;
    }

    public void setSkipExpression(String skipExpression) {
        this.skipExpression = skipExpression;
    }

    public UserTask clone() {
        UserTask clone = new UserTask();
        clone.setValues(this);
        return clone;
    }

    public void setValues(UserTask otherElement) {
        super.setValues(otherElement);
        setExtensionId(otherElement.getExtensionId());
        setSkipExpression(otherElement.getSkipExpression());
        setFormKey(otherElement.getFormKey());
        formProperties = new ArrayList<FormProperty>();
        if (otherElement.getFormProperties() != null && !otherElement.getFormProperties().isEmpty()) {
            for (FormProperty property : otherElement.getFormProperties()) {
                formProperties.add(property.clone());
            }
        }

        taskListeners = new ArrayList<ActivitiListener>();
        if (otherElement.getTaskListeners() != null && !otherElement.getTaskListeners().isEmpty()) {
            for (ActivitiListener listener : otherElement.getTaskListeners()) {
                taskListeners.add(listener.clone());
            }
        }
    }
}
