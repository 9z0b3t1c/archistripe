#!/usr/bin/env python3
"""
Simple test to directly access the full Grok response data
"""
import json
import subprocess

def get_grok_response():
    # Get documents from API
    try:
        result = subprocess.run(['curl', '-s', 'http://localhost:5000/api/documents'], 
                               capture_output=True, text=True)
        documents = json.loads(result.stdout)
        
        if not documents:
            print("No documents found")
            return
            
        doc = documents[0]
        print(f"Document: {doc['originalName']}")
        print(f"Status: {doc['status']}")
        print(f"ID: {doc['id']}")
        
        if doc.get('propertyData') and doc['propertyData'].get('rawExtractedData'):
            raw_data = doc['propertyData']['rawExtractedData']
            
            if raw_data.get('fullGrokResponse'):
                gr = raw_data['fullGrokResponse']
                print("\n✅ FULL GROK RESPONSE FOUND!")
                print("=" * 50)
                print(f"Model: {gr.get('model', 'Unknown')}")
                print(f"Total Tokens: {gr.get('total_tokens', 0):,}")
                print(f"Processing Time: {gr.get('response_time_ms', 0)/1000:.1f}s")
                print(f"Timestamp: {gr.get('timestamp', 'N/A')}")
                
                # Show raw response content
                raw_content = gr.get('full_response_content', '')
                print(f"\n📄 Raw Response Length: {len(raw_content):,} characters")
                print("First 500 characters:")
                print("-" * 50)
                print(raw_content[:500])
                print("-" * 50)
                
                # Show document classification
                if gr.get('parsed_result', {}).get('documentClassification'):
                    dc = gr['parsed_result']['documentClassification']
                    print(f"\n📋 Document Classification:")
                    print(f"Type: {dc.get('documentType', 'N/A')}")
                    print(f"Subtype: {dc.get('documentSubtype', 'N/A')}")
                
                print("\n🎯 SUCCESS: Full Grok response is accessible!")
                
                # Save to file for analysis
                with open('latest_grok_response.json', 'w') as f:
                    json.dump(gr, f, indent=2)
                print("Saved full response to 'latest_grok_response.json'")
                
            else:
                print("❌ No fullGrokResponse found in raw data")
                print("Available keys:", list(raw_data.keys()))
        else:
            print("❌ No property data or raw extracted data found")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    get_grok_response()