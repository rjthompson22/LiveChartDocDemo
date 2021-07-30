## Demonstration of LiveChart's documentation Website

Live Chart is a class management tool which allows teachers to monitor and interact with 
student online course work in real time.

To dive into JavaScript Documentation, use the directory on the right.

To access the Java documentation, click the link to the Java directory beneath "Home".

Documents were created using both java docs and jsdocs.

Java Docs were generated using native JRE Java docs library, through the eclipse extension. 
The output of these docs was specified to be the Java Documentation Folder, so as not to 
interfere with the javascript documentation.

The use of jsdocs requires the installation of node.js and the jsdocs library. Within this directory is a jsdoc.json file which is used to configure the jsdocs documentation. To generate the js documentation, input "npm run jsdoc" into the command line.

The Java docs and the jsdocs were merged by manually including a hyper link between the two index files.