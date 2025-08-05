# How to Access Full Grok AI Responses

## Current Document Available
- **Document ID**: `11d90467-5e17-4c6c-bb1d-96179fbc99fb`
- **File**: `1090_001_1754407418719.pdf`
- **Status**: Completed ✅
- **Full Grok Response**: Available ✅

## ✅ CONFIRMED WORKING METHODS

## Method 1: Direct API Access (Recommended)

**Get the full Grok response:**
```bash
curl "http://localhost:5000/api/documents/11d90467-5e17-4c6c-bb1d-96179fbc99fb/grok-response"
```

**Save to file:**
```bash
curl "http://localhost:5000/api/documents/11d90467-5e17-4c6c-bb1d-96179fbc99fb/grok-response" > grok_response.json
```

**Simple Python Access (WORKING):**
```bash
python3 test_grok_access.py
```

## Method 2: Via Web Interface

1. Go to the main application: `http://localhost:5000`
2. Navigate to the Documents panel
3. Find your uploaded document
4. Click "View Full Grok Response" button (if available)

## Method 3: Browser-based Viewer

Open in browser: `http://localhost:5000/grok_response_reader.html`

## What You'll Get

The API returns a complete response including:

### Processing Metrics
- Model: `grok-4-0709`
- Prompt tokens: 1,399
- Completion tokens: 531  
- Total tokens: 1,930
- Processing time: 28.8 seconds

### Full Response Content
- Complete raw AI response text (1,700+ characters)
- Structured parsed results with all property fields
- Document classification and analysis notes
- Timestamp and usage statistics

### Example Response Structure
```json
{
  "document": {
    "id": "9e82bf4c-0160-4b10-a38d-b05b58fb7dc2",
    "originalName": "1090_001_1754407418719.pdf",
    "status": "completed"
  },
  "fullGrokResponse": {
    "model": "grok-4-0709",
    "prompt_tokens": 1399,
    "completion_tokens": 531,
    "total_tokens": 1930,
    "response_time_ms": 28771,
    "full_response_content": "{...complete AI response...}",
    "parsed_result": {...},
    "timestamp": "2025-08-05T16:34:01.048Z"
  }
}
```

## Quick Test Command

```bash
curl -s "http://localhost:5000/api/documents/9e82bf4c-0160-4b10-a38d-b05b58fb7dc2/grok-response" | python3 -c "import sys,json; data=json.load(sys.stdin); print('Model:', data['fullGrokResponse']['model']); print('Tokens:', data['fullGrokResponse']['total_tokens']); print('Response length:', len(data['fullGrokResponse']['full_response_content']), 'chars')"
```

The full Grok responses are now completely accessible for analysis, debugging, and optimization purposes.