# Folder containing homework for bootcamp preweek

## GenAI Architecting

There are two files in this folder. One is the PNG file and the RAG-LLM-System-Overview.md file contains the Mermaid version.

We decided to use Mermaid for all charting and visualization tasks, because it is a way to programmatically handle visualization without a big overhead of a framework or komplex tooling.

The Technical uncertainties, Requirements, Assumptions, Decisions and Conclusions regarding this part of the project are laid out in the info.md file in this folder.

### Architectural Design Considerations

> Business requirements
>>Our business is located in Switzerland and our customers are working in industries that are regulated and have a high burden of security requirements. This puts us in a situation, where we are not open to use arbitrarily commercial solutions.


> Functional Requirements
>>Our Natural Language Processing offerings will use RAG-enabled LLM's on self hosted hardware in Swiss datacenters. We will only use opensource models, frameworks and tools. The servers and datastores need to be in SWitzerland and the data may not left the region.


>Assumptions
>>We are assuming, that we will need a mirrored system over at least two Swiss Datacenters. We see the need to have support contracts with appropriate reaction times for our core systems. We think about using NATS,WEBAssembly and WASI inference as the underlying technology. 


>Conclusions
>>The curent state of the architectural planning, reflected in the Sytem-Overview Diagram is only a birds-eye view of the final system. 

