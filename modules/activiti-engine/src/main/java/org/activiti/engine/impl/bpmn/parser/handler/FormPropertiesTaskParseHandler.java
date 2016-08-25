package org.activiti.engine.impl.bpmn.parser.handler;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.bpmn.model.ActivitiListener;
import org.activiti.bpmn.model.BaseElement;
import org.activiti.bpmn.model.FormPropertiesTask;
import org.activiti.bpmn.model.ImplementationType;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.impl.bpmn.parser.BpmnParse;
import org.activiti.engine.impl.calendar.DueDateBusinessCalendar;
import org.activiti.engine.impl.el.ExpressionManager;
import org.activiti.engine.impl.form.DefaultTaskFormHandler;
import org.activiti.engine.impl.form.TaskFormHandler;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.task.TaskDefinition;
import org.apache.commons.lang3.StringUtils;

/**
 * Created by sagari on 19-Aug-16.
 */
public class FormPropertiesTaskParseHandler extends AbstractActivityBpmnParseHandler<FormPropertiesTask> {

    public static final String PROPERTY_TASK_DEFINITION = "taskDefinition";

    public Class< ? extends BaseElement> getHandledType() {
        return FormPropertiesTask.class;
    }

    protected void executeParse(BpmnParse bpmnParse, FormPropertiesTask formPropertiesTask) {
        ActivityImpl activity = createActivityOnCurrentScope(bpmnParse, formPropertiesTask, BpmnXMLConstants.ELEMENT_FORM_PROPERTIES_TASK_USER);

        activity.setAsync(formPropertiesTask.isAsynchronous());
        activity.setExclusive(!formPropertiesTask.isNotExclusive());

        TaskDefinition taskDefinition = parseTaskDefinition(bpmnParse, formPropertiesTask, formPropertiesTask.getId(), (ProcessDefinitionEntity) bpmnParse.getCurrentScope().getProcessDefinition());
        activity.setProperty(PROPERTY_TASK_DEFINITION, taskDefinition);
        activity.setActivityBehavior(bpmnParse.getActivityBehaviorFactory().createFormPropertiesTaskActivityBehavior(formPropertiesTask, taskDefinition));
    }

    public TaskDefinition parseTaskDefinition(BpmnParse bpmnParse, FormPropertiesTask formPropertiesTask, String taskDefinitionKey, ProcessDefinitionEntity processDefinition) {
        TaskFormHandler taskFormHandler = new DefaultTaskFormHandler();
        taskFormHandler.parseConfiguration(formPropertiesTask.getFormProperties(), formPropertiesTask.getFormKey(), bpmnParse.getDeployment(), processDefinition);

        TaskDefinition taskDefinition = new TaskDefinition(taskFormHandler);

        taskDefinition.setKey(taskDefinitionKey);
        processDefinition.getTaskDefinitions().put(taskDefinitionKey, taskDefinition);
        ExpressionManager expressionManager = bpmnParse.getExpressionManager();

        if (StringUtils.isNotEmpty(formPropertiesTask.getName())) {
            taskDefinition.setNameExpression(expressionManager.createExpression(formPropertiesTask.getName()));
        }

        if (StringUtils.isNotEmpty(formPropertiesTask.getDocumentation())) {
            taskDefinition.setDescriptionExpression(expressionManager.createExpression(formPropertiesTask.getDocumentation()));
        }

        // Task listeners
        for (ActivitiListener taskListener : formPropertiesTask.getTaskListeners()) {
            taskDefinition.addTaskListener(taskListener.getEvent(), createTaskListener(bpmnParse, taskListener, formPropertiesTask.getId()));
        }

        // Business calendar name
        if (StringUtils.isNotEmpty(formPropertiesTask.getBusinessCalendarName())) {
            taskDefinition.setBusinessCalendarNameExpression(expressionManager.createExpression(formPropertiesTask.getBusinessCalendarName()));
        } else {
            taskDefinition.setBusinessCalendarNameExpression(expressionManager.createExpression(DueDateBusinessCalendar.NAME));
        }

        // Category
        if (StringUtils.isNotEmpty(formPropertiesTask.getCategory())) {
            taskDefinition.setCategoryExpression(expressionManager.createExpression(formPropertiesTask.getCategory()));
        }

        if (StringUtils.isNotEmpty(formPropertiesTask.getFormKey())) {
            taskDefinition.setFormKeyExpression(expressionManager.createExpression(formPropertiesTask.getFormKey()));
        }
        if (StringUtils.isNotEmpty(formPropertiesTask.getSkipExpression())) {
            taskDefinition.setSkipExpression(expressionManager.createExpression(formPropertiesTask.getSkipExpression()));
        }

        return taskDefinition;
    }

    protected TaskListener createTaskListener(BpmnParse bpmnParse, ActivitiListener activitiListener, String taskId) {
        TaskListener taskListener = null;

        if (ImplementationType.IMPLEMENTATION_TYPE_CLASS.equalsIgnoreCase(activitiListener.getImplementationType())) {
            taskListener = bpmnParse.getListenerFactory().createClassDelegateTaskListener(activitiListener);
        } else if (ImplementationType.IMPLEMENTATION_TYPE_EXPRESSION.equalsIgnoreCase(activitiListener.getImplementationType())) {
            taskListener = bpmnParse.getListenerFactory().createExpressionTaskListener(activitiListener);
        } else if (ImplementationType.IMPLEMENTATION_TYPE_DELEGATEEXPRESSION.equalsIgnoreCase(activitiListener.getImplementationType())) {
            taskListener = bpmnParse.getListenerFactory().createDelegateExpressionTaskListener(activitiListener);
        }
        return taskListener;
    }
}
