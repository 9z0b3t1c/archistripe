#!/usr/bin/env python3
"""
Simple script to view full Grok AI responses from the real estate document analyzer.
Usage: python3 view_grok_responses.py
"""

import requests
import json
import sys
from datetime import datetime

API_BASE = "http://localhost:5000"

def format_tokens(tokens):
    return f"{tokens:,}" if tokens else "N/A"

def format_time(ms):
    if not ms:
        return "N/A"
    return f"{ms}ms" if ms < 1000 else f"{ms/1000:.1f}s"

def get_documents():
    """Get all documents from the API"""
    try:
        response = requests.get(f"{API_BASE}/api/documents")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching documents: {e}")
        return []

def get_grok_response(doc_id):
    """Get full Grok response for a specific document"""
    try:
        response = requests.get(f"{API_BASE}/api/documents/{doc_id}/grok-response")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching Grok response: {e}")
        return None

def display_document_list(documents):
    """Display list of available documents"""
    print("=" * 80)
    print("AVAILABLE DOCUMENTS WITH GROK RESPONSES")
    print("=" * 80)
    
    grok_docs = []
    for i, doc in enumerate(documents, 1):
        has_grok = doc.get('propertyData', {}).get('fullGrokResponse') is not None
        if has_grok:
            grok_docs.append(doc)
            print(f"{len(grok_docs)}. {doc['originalName']}")
            print(f"   Status: {doc['status']}")
            print(f"   Uploaded: {datetime.fromisoformat(doc['uploadedAt'].replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S')}")
            print()
    
    if not grok_docs:
        print("No documents with Grok responses found.")
        print("Upload a PDF document to generate Grok analysis data.")
        return []
    
    return grok_docs

def display_grok_response(grok_data):
    """Display full Grok response data"""
    doc = grok_data['document']
    gr = grok_data['fullGrokResponse']
    
    print("=" * 80)
    print(f"FULL GROK RESPONSE: {doc['originalName']}")
    print("=" * 80)
    
    # Metrics
    print("📊 PROCESSING METRICS:")
    print(f"   Model: {gr.get('model', 'Unknown')}")
    print(f"   Prompt Tokens: {format_tokens(gr.get('prompt_tokens'))}")
    print(f"   Completion Tokens: {format_tokens(gr.get('completion_tokens'))}")
    print(f"   Total Tokens: {format_tokens(gr.get('total_tokens'))}")
    print(f"   Processing Time: {format_time(gr.get('response_time_ms'))}")
    print(f"   Response Size: {len(gr.get('full_response_content', '')):,} characters")
    print(f"   Timestamp: {gr.get('timestamp', 'N/A')}")
    print()
    
    # Document Classification
    if gr.get('parsed_result', {}).get('documentClassification'):
        dc = gr['parsed_result']['documentClassification']
        print("📋 DOCUMENT CLASSIFICATION:")
        print(f"   Type: {dc.get('documentType', 'N/A')}")
        print(f"   Subtype: {dc.get('documentSubtype', 'N/A')}")
        print()
    
    # Raw Response Content
    print("📄 RAW GROK RESPONSE CONTENT:")
    print("-" * 80)
    raw_content = gr.get('full_response_content', '')
    if raw_content:
        try:
            # Try to pretty print if it's JSON
            parsed = json.loads(raw_content)
            print(json.dumps(parsed, indent=2)[:2000])
            if len(raw_content) > 2000:
                print(f"\n... (truncated, full content is {len(raw_content):,} chars)")
        except:
            # Fall back to raw text
            print(raw_content[:2000])
            if len(raw_content) > 2000:
                print(f"\n... (truncated, full content is {len(raw_content):,} chars)")
    else:
        print("No raw content available")
    print("-" * 80)
    print()

def main():
    print("Real Estate Document Analyzer - Grok Response Viewer")
    print("=" * 60)
    
    # Get all documents
    documents = get_documents()
    if not documents:
        print("No documents found.")
        return
    
    # Show documents with Grok responses
    grok_docs = display_document_list(documents)
    if not grok_docs:
        return
    
    # Let user select a document
    while True:
        try:
            choice = input(f"\nSelect document (1-{len(grok_docs)}) or 'q' to quit: ").strip()
            if choice.lower() == 'q':
                break
            
            doc_num = int(choice)
            if 1 <= doc_num <= len(grok_docs):
                selected_doc = grok_docs[doc_num - 1]
                
                # Get full Grok response
                grok_data = get_grok_response(selected_doc['id'])
                if grok_data:
                    display_grok_response(grok_data)
                    
                    # Ask if user wants to save to file
                    save = input("\nSave full response to file? (y/n): ").strip().lower()
                    if save == 'y':
                        filename = f"grok_response_{selected_doc['id'][:8]}.json"
                        with open(filename, 'w') as f:
                            json.dump(grok_data, f, indent=2)
                        print(f"Saved to {filename}")
                else:
                    print("Failed to retrieve Grok response.")
            else:
                print("Invalid selection.")
        except (ValueError, KeyboardInterrupt):
            break
    
    print("\nGoodbye!")

if __name__ == "__main__":
    main()