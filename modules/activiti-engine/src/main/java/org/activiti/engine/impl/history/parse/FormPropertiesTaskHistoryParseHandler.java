package org.activiti.engine.impl.history.parse;

import org.activiti.bpmn.model.BaseElement;
import org.activiti.bpmn.model.FormPropertiesTask;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.impl.bpmn.parser.BpmnParse;
import org.activiti.engine.impl.bpmn.parser.handler.AbstractBpmnParseHandler;
import org.activiti.engine.impl.bpmn.parser.handler.FormPropertiesTaskParseHandler;
import org.activiti.engine.impl.history.handler.FormPropertiesTaskAssignmentHandler;
import org.activiti.engine.impl.history.handler.FormPropertiesTaskIdHandler;
import org.activiti.engine.impl.task.TaskDefinition;

/**
 * Created by sagari on 19-Aug-16.
 */
public class FormPropertiesTaskHistoryParseHandler extends AbstractBpmnParseHandler<FormPropertiesTask> {

    protected static final FormPropertiesTaskAssignmentHandler FORM_PROPERTIES_TASK_ASSIGNMENT_HANDLER = new FormPropertiesTaskAssignmentHandler();

    protected static final FormPropertiesTaskIdHandler FORM_PROPERTIES_TASK_ID_HANDLER = new FormPropertiesTaskIdHandler();

    protected Class<? extends BaseElement> getHandledType() {
        return FormPropertiesTask.class;
    }

    protected void executeParse(BpmnParse bpmnParse, FormPropertiesTask element) {
        TaskDefinition taskDefinition = (TaskDefinition) bpmnParse.getCurrentActivity().getProperty(FormPropertiesTaskParseHandler.PROPERTY_TASK_DEFINITION);
        taskDefinition.addTaskListener(TaskListener.EVENTNAME_ASSIGNMENT, FORM_PROPERTIES_TASK_ASSIGNMENT_HANDLER);
        taskDefinition.addTaskListener(TaskListener.EVENTNAME_CREATE, FORM_PROPERTIES_TASK_ID_HANDLER);
    }
}
