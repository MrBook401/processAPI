# 1. create the spec file for a process manager API 

The goal of the API is to create a "release plan" based on events in the future  where the release management user can input a name and timewindows for the TEST, PREPROD and PROD release days. 

A second enpoint should allow to attach a "release" via it's release ID to an event, this is for the development team

endpoints 

* /events/ with POST, GET and PATCH
* /release/attach/ with post and patch, will attach a releaseID to an event 
* /release/validate/id will caluclate if a release is within the event's timewindow

# 2. break down the specs into an implemntation plan 

# 3. Implement the implementation plan 