#!/usr/bin/env python3
"""
Show all Grok responses from all processed documents
"""
import json
import subprocess

def show_all_grok_responses():
    try:
        # Get all documents
        result = subprocess.run(['curl', '-s', 'http://localhost:5000/api/documents'], 
                               capture_output=True, text=True)
        documents = json.loads(result.stdout)
        
        if not documents:
            print("No documents found")
            return
            
        print(f"Found {len(documents)} document(s)")
        print("=" * 60)
        
        grok_count = 0
        
        for i, doc in enumerate(documents, 1):
            print(f"\n{i}. Document: {doc['originalName']}")
            print(f"   ID: {doc['id']}")
            print(f"   Status: {doc['status']}")
            print(f"   Uploaded: {doc['uploadedAt']}")
            
            if doc.get('propertyData') and doc['propertyData'].get('rawExtractedData'):
                raw_data = doc['propertyData']['rawExtractedData']
                
                if raw_data.get('fullGrokResponse'):
                    grok_count += 1
                    gr = raw_data['fullGrokResponse']
                    
                    print(f"   ✅ FULL GROK RESPONSE AVAILABLE")
                    print(f"   Model: {gr.get('model', 'Unknown')}")
                    print(f"   Tokens: {gr.get('total_tokens', 0):,}")
                    print(f"   Time: {gr.get('response_time_ms', 0)/1000:.1f}s")
                    
                    # Document classification
                    if gr.get('parsed_result', {}).get('documentClassification'):
                        dc = gr['parsed_result']['documentClassification']
                        print(f"   Type: {dc.get('documentType', 'N/A')}")
                        print(f"   Subtype: {dc.get('documentSubtype', 'N/A')}")
                    
                    # Show sample of raw response
                    raw_content = gr.get('full_response_content', '')
                    if raw_content:
                        print(f"   Raw response: {len(raw_content):,} chars")
                        print(f"   Sample: {raw_content[:100]}...")
                        
                        # Save each response to a separate file
                        filename = f"grok_response_{doc['id'][:8]}.json"
                        with open(filename, 'w') as f:
                            json.dump(gr, f, indent=2)
                        print(f"   Saved to: {filename}")
                    
                else:
                    print(f"   ❌ No Grok response")
            else:
                print(f"   ❌ No processed data")
        
        print(f"\n" + "=" * 60)
        print(f"SUMMARY: {grok_count} document(s) with full Grok responses available")
        
        if grok_count > 0:
            print("\nYou can now:")
            print("1. Read the JSON files saved above for complete responses")
            print("2. Use this script anytime to check all documents")
            print("3. Access raw response content for analysis")
        else:
            print("\nNo Grok responses found. Upload and process documents first.")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    show_all_grok_responses()