package org.activiti.workflow.simple.converter.step;

import org.activiti.bpmn.model.FormPropertiesTask;
import org.activiti.bpmn.model.StartEvent;
import org.activiti.workflow.simple.converter.ConversionConstants;
import org.activiti.workflow.simple.converter.WorkflowDefinitionConversion;
import org.activiti.workflow.simple.definition.FormPropertiesTaskStepDefinition;
import org.activiti.workflow.simple.definition.StepDefinition;
import org.activiti.workflow.simple.definition.form.FormDefinition;

/**
 * Created by sagari on 22-Aug-16.
 */
public class FormPropertiesTaskStepDefinitionConverter extends BaseStepDefinitionConverter<FormPropertiesTaskStepDefinition, FormPropertiesTask> {

    private static final long serialVersionUID = 1L;

    private static final String DEFAULT_INITIATOR_VARIABLE = "initiator";
    public Class<? extends StepDefinition> getHandledClass() {
        return FormPropertiesTaskStepDefinition.class;
    }


    protected FormPropertiesTask createProcessArtifact(FormPropertiesTaskStepDefinition stepDefinition, WorkflowDefinitionConversion conversion) {
        FormPropertiesTask formPropertiesTask = createFormPropertiesTask(stepDefinition, conversion);
        addFlowElement(conversion, formPropertiesTask, true);

        return formPropertiesTask;
    }

    protected FormPropertiesTask createFormPropertiesTask(FormPropertiesTaskStepDefinition propertiesTaskStepDefinition, WorkflowDefinitionConversion conversion) {

        // TODO: validate and throw exception on missing properties

        FormPropertiesTask formPropertiesTask = new FormPropertiesTask();
        formPropertiesTask.setId(conversion.getUniqueNumberedId(ConversionConstants.FORM_PROPERTIES_TASK_ID_PREFIX));
        formPropertiesTask.setName(propertiesTaskStepDefinition.getName());
        formPropertiesTask.setDocumentation(propertiesTaskStepDefinition.getDescription());

        for (StartEvent startEvent : conversion.getProcess().findFlowElementsOfType(StartEvent.class)) {
            startEvent.setInitiator(getInitiatorVariable());
        }

        // Form
        if (propertiesTaskStepDefinition.getForm() != null) {
            FormDefinition formDefinition = propertiesTaskStepDefinition.getForm();
            // Form properties
            formPropertiesTask.setFormProperties(convertProperties(formDefinition));
            if (formDefinition.getFormKey() != null) {
                formPropertiesTask.setFormKey(formDefinition.getFormKey());
            }
        }

        return formPropertiesTask;
    }

    //Extracted in a method such that subclasses can override if needed
    protected String getInitiatorVariable() {
        return DEFAULT_INITIATOR_VARIABLE;
    }
}
