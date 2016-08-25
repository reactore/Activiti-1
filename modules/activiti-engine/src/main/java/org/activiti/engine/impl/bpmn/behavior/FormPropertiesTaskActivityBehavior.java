package org.activiti.engine.impl.bpmn.behavior;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.activiti.engine.ActivitiException;
import org.activiti.engine.ActivitiIllegalArgumentException;
import org.activiti.engine.DynamicBpmnConstants;
import org.activiti.engine.delegate.Expression;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.delegate.event.ActivitiEventType;
import org.activiti.engine.delegate.event.impl.ActivitiEventBuilder;
import org.activiti.engine.impl.bpmn.helper.SkipExpressionUtil;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.activiti.engine.impl.pvm.delegate.ActivityExecution;
import org.activiti.engine.impl.task.TaskDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;

/**
 * Created by sagari on 19-Aug-16.
 */
public class FormPropertiesTaskActivityBehavior extends TaskActivityBehavior {

    private static final long serialVersionUID = 1L;

    private static final Logger LOGGER = LoggerFactory.getLogger(UserTaskActivityBehavior.class);

    protected String formPropertiesTaskId;
    protected TaskDefinition taskDefinition;

    public FormPropertiesTaskActivityBehavior(String formPropertiesTaskId, TaskDefinition taskDefinition) {
        this.formPropertiesTaskId = formPropertiesTaskId;
        this.taskDefinition = taskDefinition;
    }

    public void execute(ActivityExecution execution) throws Exception {
        TaskEntity task = TaskEntity.createAndInsert(execution);
        task.setExecution(execution);

        Expression activeNameExpression = null;
        Expression activeCategoryExpression = null;
        Expression activeFormKeyExpression = null;
        Expression activeSkipExpression = null;
        Expression activeDescriptionExpression = null;
        Expression activeDueDateExpression = null;
        Expression activePriorityExpression = null;
        Expression activeAssigneeExpression = null;
        Expression activeOwnerExpression = null;
        Set<Expression> activeCandidateUserExpressions = null;
        Set<Expression> activeCandidateGroupExpressions = null;

        if (Context.getProcessEngineConfiguration().isEnableProcessDefinitionInfoCache()) {
            ObjectNode taskElementProperties = Context.getBpmnOverrideElementProperties(formPropertiesTaskId, execution.getProcessDefinitionId());
            activeNameExpression = getActiveValue(taskDefinition.getNameExpression(), DynamicBpmnConstants.FORM_PROPERTIES_TASK_NAME, taskElementProperties);
            taskDefinition.setNameExpression(activeNameExpression);
            activeDescriptionExpression = getActiveValue(taskDefinition.getDescriptionExpression(), DynamicBpmnConstants.FORM_PROPERTIES_TASK_DESCRIPTION, taskElementProperties);
            taskDefinition.setDescriptionExpression(activeDescriptionExpression);
            activeCategoryExpression = getActiveValue(taskDefinition.getCategoryExpression(), DynamicBpmnConstants.FORM_PROPERTIES_TASK_CATEGORY, taskElementProperties);
            taskDefinition.setCategoryExpression(activeCategoryExpression);
            activeFormKeyExpression = getActiveValue(taskDefinition.getFormKeyExpression(), DynamicBpmnConstants.FORM_PROPERTIES_TASK_FORM_KEY, taskElementProperties);
            taskDefinition.setFormKeyExpression(activeFormKeyExpression);
            activeSkipExpression = getActiveValue(taskDefinition.getSkipExpression(), DynamicBpmnConstants.TASK_SKIP_EXPRESSION, taskElementProperties);
            taskDefinition.setSkipExpression(activeSkipExpression);
            taskDefinition.setAssigneeExpression(activeAssigneeExpression);
            taskDefinition.setOwnerExpression(activeOwnerExpression);
            taskDefinition.setDueDateExpression(activeDueDateExpression);
            taskDefinition.setPriorityExpression(activePriorityExpression);
            taskDefinition.setCandidateUserIdExpressions(activeCandidateUserExpressions);
            taskDefinition.setCandidateGroupIdExpressions(activeCandidateGroupExpressions);
        } else {
            activeNameExpression = taskDefinition.getNameExpression();
            activeDescriptionExpression = taskDefinition.getDescriptionExpression();
            activeDueDateExpression = taskDefinition.getDueDateExpression();
            activePriorityExpression = taskDefinition.getPriorityExpression();
            activeCategoryExpression = taskDefinition.getCategoryExpression();
            activeFormKeyExpression = taskDefinition.getFormKeyExpression();
            activeSkipExpression = taskDefinition.getSkipExpression();
            activeAssigneeExpression = taskDefinition.getAssigneeExpression();
            activeOwnerExpression = taskDefinition.getOwnerExpression();
            activeCandidateUserExpressions = taskDefinition.getCandidateUserIdExpressions();
            activeCandidateGroupExpressions = taskDefinition.getCandidateGroupIdExpressions();
        }
        task.setTaskDefinition(taskDefinition);

        if (activeNameExpression != null) {
            String name = null;
            try {
                name = (String) activeNameExpression.getValue(execution);
            } catch (ActivitiException e) {
                name = activeNameExpression.getExpressionText();
                LOGGER.warn("property not found in task name expression " + e.getMessage());
            }
            task.setName(name);
        }

        if (activeDescriptionExpression != null) {
            String description = null;
            try {
                description = (String) activeDescriptionExpression.getValue(execution);
            } catch (ActivitiException e) {
                description = activeDescriptionExpression.getExpressionText();
                LOGGER.warn("property not found in task description expression " + e.getMessage());
            }
            task.setDescription(description);
        }

        if (activeCategoryExpression != null) {
            final Object category = activeCategoryExpression.getValue(execution);
            if (category != null) {
                if (category instanceof String) {
                    task.setCategory((String) category);
                } else {
                    throw new ActivitiIllegalArgumentException("Category expression does not resolve to a string: " +
                            activeCategoryExpression.getExpressionText());
                }
            }
        }

        if (activeFormKeyExpression != null) {
            final Object formKey = activeFormKeyExpression.getValue(execution);
            if (formKey != null) {
                if (formKey instanceof String) {
                    task.setFormKey((String) formKey);
                } else {
                    throw new ActivitiIllegalArgumentException("FormKey expression does not resolve to a string: " +
                            activeFormKeyExpression.getExpressionText());
                }
            }
        }
        task.complete(null, false);
        task.fireEvent(TaskListener.EVENTNAME_COMPLETE);
    }

    protected Expression getActiveValue(Expression originalValue, String propertyName, ObjectNode taskElementProperties) {
        Expression activeValue = originalValue;
        if (taskElementProperties != null) {
            JsonNode overrideValueNode = taskElementProperties.get(propertyName);
            if (overrideValueNode != null) {
                if (overrideValueNode.isNull()) {
                    activeValue = null;
                } else {
                    activeValue = Context.getProcessEngineConfiguration().getExpressionManager().createExpression(overrideValueNode.asText());
                }
            }
        }
        return activeValue;
    }

    public void signal(ActivityExecution execution, String signalName, Object signalData) throws Exception {
        if (!((ExecutionEntity) execution).getTasks().isEmpty())
            throw new ActivitiException("FormPropertiesTask should not be signalled before complete");
        leave(execution);
    }

    public TaskDefinition getTaskDefinition() {
        return taskDefinition;
    }
}
