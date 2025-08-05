#!/usr/bin/env python3
"""
Quick script to show full Grok responses from your documents
"""
import requests
import json

def show_grok_responses():
    try:
        # Get documents
        docs = requests.get("http://localhost:5000/api/documents").json()
        
        if not docs:
            print("No documents found. Upload a PDF first.")
            return
            
        print(f"Found {len(docs)} document(s)")
        
        for doc in docs:
            print(f"\n📄 Document: {doc['originalName']}")
            print(f"   Status: {doc['status']}")
            
            if doc['status'] == 'completed':
                # Try to get full Grok response
                try:
                    grok_resp = requests.get(f"http://localhost:5000/api/documents/{doc['id']}/grok-response")
                    
                    if grok_resp.status_code == 200:
                        data = grok_resp.json()
                        gr = data['fullGrokResponse']
                        
                        print(f"   ✅ Full Grok Response Available!")
                        print(f"   Model: {gr.get('model', 'Unknown')}")
                        print(f"   Tokens: {gr.get('total_tokens', 0):,}")
                        print(f"   Processing Time: {gr.get('response_time_ms', 0)/1000:.1f}s")
                        
                        # Show first part of raw response
                        raw = gr.get('full_response_content', '')
                        if raw:
                            print(f"\n   🔍 RAW GROK RESPONSE (first 300 chars):")
                            print(f"   {raw[:300]}...")
                            
                        # Show parsed classification
                        if gr.get('parsed_result', {}).get('documentClassification'):
                            dc = gr['parsed_result']['documentClassification']
                            print(f"\n   📋 Document Classification:")
                            print(f"   Type: {dc.get('documentType', 'N/A')}")
                            print(f"   Subtype: {dc.get('documentSubtype', 'N/A')}")
                            
                    else:
                        print(f"   ❌ No Grok response: {grok_resp.status_code}")
                        
                except Exception as e:
                    print(f"   ❌ Error accessing Grok response: {e}")
            else:
                print(f"   ⏳ Document not yet processed")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    show_grok_responses()