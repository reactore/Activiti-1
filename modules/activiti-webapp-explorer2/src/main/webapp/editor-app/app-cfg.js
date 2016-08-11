/*
 * Activiti Modeler component part of the Activiti project
 * Copyright 2005-2014 Alfresco Software, Ltd. All rights reserved.
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.

 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */
'use strict';

var ACTIVITI = ACTIVITI || {};

ACTIVITI.CONFIG = {
	'contextRoot' : '/activiti-explorer/service'
};
ACTIVITI.REACTORE_CONFIG = {
	'DEFAULT_SERVICE_CLASS_NAME': 'com.reactore.workflow.feature.activitilink.RestCall',
	'COMMON_SERVER_URL' : 'http://192.168.1.132:90/common/',
    'WORKFLOW_SERVER_URL': 'http://192.168.1.132:90/workflow/'
};
