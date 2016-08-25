package org.activiti.engine.impl.history.handler;

import org.activiti.engine.delegate.DelegateTask;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.TaskEntity;

/**
 * Created by sagari on 19-Aug-16.
 */
public class FormPropertiesTaskAssignmentHandler implements TaskListener {

    public void notify(DelegateTask task) {
        Context.getCommandContext().getHistoryManager()
                .recordTaskAssignment((TaskEntity) task);
    }

}
