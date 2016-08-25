package org.activiti.workflow.simple.definition;

import com.fasterxml.jackson.annotation.JsonTypeName;
import org.activiti.workflow.simple.definition.form.FormDefinition;
import org.activiti.workflow.simple.exception.SimpleWorkflowException;

import java.util.HashMap;

/**
 * Created by sagari on 22-Aug-16.
 */
@JsonTypeName("formproperties-step")
public class FormPropertiesTaskStepDefinition extends AbstractNamedStepDefinition implements FormStepDefinition {

    private static final long serialVersionUID = 1L;

    protected FormDefinition form;

    public FormDefinition getForm() {
        return form;
    }

    public FormPropertiesTaskStepDefinition addForm(FormDefinition form) {
        this.form = form;
        return this;
    }

    public void setForm(FormDefinition form) {
        this.form = form;
    }

    @Override
    public StepDefinition clone() {
        FormPropertiesTaskStepDefinition clone = new FormPropertiesTaskStepDefinition();
        clone.setValues(this);
        return clone;
    }

    @Override
    public void setValues(StepDefinition otherDefinition) {
        if (!(otherDefinition instanceof FormPropertiesTaskStepDefinition)) {
            throw new SimpleWorkflowException("An instance of HumanStepDefinition is required to set values");
        }

        FormPropertiesTaskStepDefinition stepDefinition = (FormPropertiesTaskStepDefinition) otherDefinition;
        setDescription(stepDefinition.getDescription());
        if (stepDefinition.getForm() != null) {
            setForm(stepDefinition.getForm().clone());
        } else {
            setForm(null);
        }
        setId(stepDefinition.getId());
        setName(stepDefinition.getName());
        setStartsWithPrevious(stepDefinition.isStartsWithPrevious());
        setParameters(new HashMap<String, Object>(otherDefinition.getParameters()));
    }
}
