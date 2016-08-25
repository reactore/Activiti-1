package org.activiti.standalone.parsing;

import org.activiti.bpmn.model.FormPropertiesTask;
import org.activiti.engine.impl.bpmn.parser.BpmnParse;
import org.activiti.engine.impl.bpmn.parser.handler.FormPropertiesTaskParseHandler;
import org.activiti.engine.impl.pvm.process.ActivityImpl;

/**
 * Created by sagari on 22-Aug-16.
 */
public class CustomFormPropertiesTaskBpmnParseHandler extends FormPropertiesTaskParseHandler {
    protected void executeParse(BpmnParse bpmnParse, FormPropertiesTask formPropertiesTask) {

        // Do the regular stuff
        super.executeParse(bpmnParse, formPropertiesTask);

        // Make user tasks always async
        ActivityImpl activity = findActivity(bpmnParse, formPropertiesTask.getId());
        activity.setAsync(true);
    }
}
