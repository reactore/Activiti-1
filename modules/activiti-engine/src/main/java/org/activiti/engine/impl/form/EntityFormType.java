package org.activiti.engine.impl.form;

import org.activiti.engine.form.AbstractFormType;

/**
 * Created by sagari on 03-Aug-16.
 */
public class EntityFormType extends AbstractFormType {

    private static final long serialVersionUID = 1L;

    public String getName() {
        return "entity";
    }

    public String getMimeType() {
        return "text/plain";
    }

    public Object convertFormValueToModelValue(String propertyValue) {
        return propertyValue;
    }

    public String convertModelValueToFormValue(Object modelValue) {
        return (String) modelValue;
    }

}
