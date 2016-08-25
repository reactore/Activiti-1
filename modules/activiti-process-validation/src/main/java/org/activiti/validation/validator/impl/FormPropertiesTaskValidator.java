package org.activiti.validation.validator.impl;

import org.activiti.bpmn.model.ActivitiListener;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.bpmn.model.FormPropertiesTask;
import org.activiti.bpmn.model.Process;
import org.activiti.validation.ValidationError;
import org.activiti.validation.validator.Problems;
import org.activiti.validation.validator.ProcessLevelValidator;

import java.util.List;

/**
 * Created by sagari on 19-Aug-16.
 */
public class FormPropertiesTaskValidator extends ProcessLevelValidator {

    @Override
    protected void executeValidation(BpmnModel bpmnModel, Process process, List<ValidationError> errors) {
        List<FormPropertiesTask> formPropertiesTasks = process.findFlowElementsOfType(FormPropertiesTask.class);
        for (FormPropertiesTask formPropertiesTask : formPropertiesTasks) {
            if (formPropertiesTask.getTaskListeners() != null) {
                for (ActivitiListener listener : formPropertiesTask.getTaskListeners()) {
                    if (listener.getImplementation() == null || listener.getImplementationType() == null) {
                        addError(errors, Problems.USER_TASK_LISTENER_IMPLEMENTATION_MISSING, process, formPropertiesTask,
                                "Element 'class' or 'expression' is mandatory on executionListener");
                    }
                }
            }
        }
    }

}
