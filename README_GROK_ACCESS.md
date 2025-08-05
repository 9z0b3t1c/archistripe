# How to Access Full Grok AI Responses

The real estate document analyzer now stores complete Grok AI responses for analysis and debugging. Here are multiple ways to access them:

## 1. Via API Endpoint

**Get document list:**
```bash
curl http://localhost:5000/api/documents
```

**Get full Grok response for a specific document:**
```bash
curl http://localhost:5000/api/documents/{DOCUMENT_ID}/grok-response
```

## 2. Via Web Interface (GrokResponseViewer)

The system includes a React component `GrokResponseViewer` that displays full responses in the documents panel:
- Click "View Full Grok Response" button for any processed document
- View organized tabs: Summary, Parsed Result, Raw Response, Full Metadata
- Copy JSON data to clipboard
- See processing metrics and token usage

## 3. Via Python Script

Use the included `view_grok_responses.py` script:
```bash
python3 view_grok_responses.py
```

This interactive script allows you to:
- List all documents with Grok responses
- Select and view detailed response data
- Save responses to JSON files
- Pretty-print JSON content

## 4. Via Browser Tool

Open `grok_response_reader.html` in your browser:
```
http://localhost:5000/grok_response_reader.html
```

Features:
- Live document list with refresh
- Tabbed interface for different data views
- Formatted metrics display
- Copy functionality

## What's Stored in Full Grok Responses

Each full response contains:

### Processing Metrics
- `model`: AI model used (e.g., "grok-4-0709")
- `prompt_tokens`: Input tokens consumed
- `completion_tokens`: Output tokens generated
- `total_tokens`: Combined token usage
- `response_time_ms`: Processing time in milliseconds
- `timestamp`: When the analysis was performed

### Content Data
- `full_response_content`: Complete raw AI response text
- `parsed_result`: Structured extracted property data
- `usage`: Detailed token usage breakdown

### Example Response Structure
```json
{
  "document": {
    "id": "doc-id",
    "originalName": "property.pdf",
    "status": "completed"
  },
  "fullGrokResponse": {
    "model": "grok-4-0709",
    "usage": {
      "prompt_tokens": 980,
      "completion_tokens": 438,
      "total_tokens": 1814
    },
    "response_time_ms": 21521,
    "full_response_content": "{...complete JSON response...}",
    "parsed_result": {
      "basicPropertyInfo": {...},
      "documentClassification": {...}
    },
    "timestamp": "2025-08-05T16:27:20.990Z"
  },
  "grokModelUsed": "grok-4-0709",
  "grokTokensUsed": 1814,
  "grokProcessingTime": 21521
}
```

## Current Status

✅ **Full Grok response storage is operational**
- All new document processing captures complete AI responses
- Responses include timing, token usage, and full content
- Multiple access methods available for analysis
- Data is persisted in the database for historical analysis

## Troubleshooting

If you can't access responses:
1. Ensure the document has been fully processed (status: "completed")
2. Check that the document was processed after the Grok response storage was implemented
3. Use the API endpoint directly to verify data availability
4. Check the database for `fullGrokResponse` field in the property_data table

The system now provides complete transparency into AI processing for debugging, optimization, and analysis purposes.