# Workflow Template

Copy this template and fill in the steps for your workflow.

```json
{
  "structure": {
    "name": "REPLACE: Internal Label",
    "actionName": "REPLACE: Human-Readable Title",
    "baseUrl": "",
    "screenshotEnabled": true,
    "steps": [
      {
        "step_number": 1,
        "action_type": "navigate",
        "url": "https://example.com",
        "readOnly": true,
        "requiresLogin": false,
        "timestamp": 1772453486389,
        "stepId": "step-00001"
      }
    ],
    "parameters": {
      "execute": []
    },
    "groups": []
  },
  "commitMessage": "REPLACE: Describe what this workflow does"
}
```

## Minimal step templates by action type

### navigate
```json
{ "step_number": 1, "action_type": "navigate", "url": "https://example.com", "readOnly": true, "stepId": "step-XXXXX", "timestamp": 0 }
```

### click
```json
{ "step_number": 2, "action_type": "click", "selectors": ["#button"], "stepId": "step-XXXXX", "timestamp": 0 }
```

### fill
```json
{ "step_number": 3, "action_type": "fill", "selectors": ["input[name='email']"], "value": "user@example.com", "stepId": "step-XXXXX", "timestamp": 0 }
```

### type
```json
{ "step_number": 4, "action_type": "type", "value": "Hello World", "selectors": ["textarea"], "stepId": "step-XXXXX", "timestamp": 0 }
```

### hover
```json
{ "step_number": 5, "action_type": "hover", "selectors": [".dropdown-trigger"], "stepId": "step-XXXXX", "timestamp": 0 }
```

### select
```json
{ "step_number": 6, "action_type": "select", "selectors": ["select#country"], "value": "NL", "stepId": "step-XXXXX", "timestamp": 0 }
```

### scroll
```json
{ "step_number": 7, "action_type": "scroll", "data": { "x": 0, "y": 500 }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### manual_scroll
```json
{ "step_number": 8, "action_type": "manual_scroll", "scrollDirection": "down", "stepId": "step-XXXXX", "timestamp": 0 }
```

### keypress
```json
{ "step_number": 9, "action_type": "keypress", "value": "Enter", "stepId": "step-XXXXX", "timestamp": 0 }
```

### keyboard_type
```json
{ "step_number": 10, "action_type": "keyboard_type", "value": "search term", "stepId": "step-XXXXX", "timestamp": 0 }
```

### wait
```json
{ "step_number": 11, "action_type": "wait", "stepId": "step-XXXXX", "timestamp": 0 }
```

### upload
```json
{ "step_number": 12, "action_type": "upload", "selectors": ["input[type='file']"], "value": "document.pdf", "uploadType": "file", "stepId": "step-XXXXX", "timestamp": 0 }
```

### download
```json
{ "step_number": 13, "action_type": "download", "selectors": ["a.download-link"], "stepId": "step-XXXXX", "timestamp": 0 }
```

### screenshot
```json
{ "step_number": 14, "action_type": "screenshot", "stepId": "step-XXXXX", "timestamp": 0 }
```

### switch_tab
```json
{ "step_number": 15, "action_type": "switch_tab", "data": { "tabIndex": 1 }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### blank_step
```json
{ "step_number": 16, "action_type": "blank_step", "stepId": "step-XXXXX", "timestamp": 0 }
```

### take_control
```json
{ "step_number": 17, "action_type": "take_control", "stepId": "step-XXXXX", "timestamp": 0 }
```

### llm
```json
{ "step_number": 18, "action_type": "llm", "llmActionType": "click", "userPrompt": "Click the Add to Cart button", "llmModel": "model-id", "selectors": [], "stepId": "step-XXXXX", "timestamp": 0 }
```

### llm_command
```json
{ "step_number": 19, "action_type": "llm_command", "userPrompt": "Extract the total price", "llmModel": "model-id", "stepId": "step-XXXXX", "timestamp": 0 }
```

### goal
```json
{ "step_number": 20, "action_type": "goal", "userPrompt": "Find the cheapest flight", "systemPrompt": "You are a precise browser agent.", "llmModel": "model-id", "llmActionType": "goal", "flowType": "linear", "goalMaxSteps": 20, "persistGoalActions": true, "autoContinueGoal": false, "selectors": [], "stepId": "step-XXXXX", "timestamp": 0 }
```

### confirmation
```json
{ "step_number": 21, "action_type": "confirmation", "readOnly": true, "label": "Confirm", "userPrompt": "Proceed?", "stepId": "step-XXXXX", "timestamp": 0 }
```

### manual_extract
```json
{ "step_number": 22, "action_type": "manual_extract", "userPrompt": "Extract all product names and prices", "llmModel": "model-id", "label": "Extract Products", "stepId": "step-XXXXX", "timestamp": 0 }
```

### continuous_screenshots
```json
{ "step_number": 23, "action_type": "continuous_screenshots", "data": { "interval": 5000, "duration": 60000 }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### image_response
```json
{ "step_number": 24, "action_type": "image_response", "fullPage": true, "maxImages": 10, "stepId": "step-XXXXX", "timestamp": 0 }
```

### pdf_response
```json
{ "step_number": 25, "action_type": "pdf_response", "fullPage": true, "stepId": "step-XXXXX", "timestamp": 0 }
```

### api_call
```json
{ "step_number": 26, "action_type": "api_call", "api_config": { "endpoint": "https://api.example.com/data", "method": "GET", "headers": {}, "auth": { "type": "none" } }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### rest_api
```json
{ "step_number": 27, "action_type": "rest_api", "restApiConfig": { "method": "GET", "url": "https://api.example.com/users", "headers": [], "auth": { "type": "none" }, "bodyType": "none", "timeout": 30000 }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### llm_rest_api
```json
{ "step_number": 28, "action_type": "llm_rest_api", "llmRestApiConfig": { "modelSource": "existing", "existingModelId": "model-id", "systemPrompt": "You are helpful", "userPrompt": "Summarize this", "responseFormat": "text" }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### mcp_tool
```json
{ "step_number": 29, "action_type": "mcp_tool", "mcpServerId": "server-id", "mcpServerUrl": "https://mcp.example.com", "stepId": "step-XXXXX", "timestamp": 0 }
```

### data_source_read
```json
{ "step_number": 30, "action_type": "data_source_read", "dataSourceReadConfig": { "connectorId": "uuid", "kind": "postgres", "operation": "query", "query": "SELECT * FROM users" }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### data_source_write
```json
{ "step_number": 31, "action_type": "data_source_write", "dataSourceWriteConfig": { "connectorId": "uuid", "kind": "postgres", "operation": "insert", "query": "INSERT INTO logs (msg) VALUES ($1)", "values": "[\"entry\"]", "mode": "execute" }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### api_output
```json
{ "step_number": 32, "action_type": "api_output", "outputName": "result", "outputFields": [{ "key": "data", "value": "{{step-XXXXX.response}}", "type": "string" }], "stepId": "step-XXXXX", "timestamp": 0 }
```

### notification
```json
{ "step_number": 33, "action_type": "notification", "stepId": "step-XXXXX", "timestamp": 0 }
```

### generate_media
```json
{ "step_number": 34, "action_type": "generate_media", "mediaType": "image", "userPrompt": "A mountain landscape", "multimodalProvider": "provider", "mediaOptions": { "aspectRatio": "16:9", "numberOfImages": 1 }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### stitch_videos
```json
{ "step_number": 35, "action_type": "stitch_videos", "videoStitchConfig": { "sourceMode": "manual", "clips": [], "output": { "audioPolicy": "keep", "outputProfile": "match_first_clip" } }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### coding_agent
```json
{ "step_number": 36, "action_type": "coding_agent", "userPrompt": "Write a script to process data", "sandboxAgentConfig": { "agentType": "coding", "codingModel": "claude_code", "sandboxProvider": "e2b", "sandboxProviderId": "sandbox-provider-123" }, "stepId": "step-XXXXX", "timestamp": 0 }
```

### computer_use_agent
```json
{ "step_number": 37, "action_type": "computer_use_agent", "userPrompt": "Open spreadsheet and update cell A1", "sandboxAgentConfig": { "agentType": "computer_use", "visionModel": "model-id", "sandboxProvider": "e2b", "sandboxProviderId": "sandbox-provider-123" }, "stepId": "step-XXXXX", "timestamp": 0 }
```
