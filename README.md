# Corner Time

This is an application that tells you, using voice instructions, go to a corner and stay there without moving until a certain time has passed.

Use it on yourself as a conditioning method (caught yourself picking your nose? get in the corner!) or just for, err, fun. Use it on someone else as part of a long-distance D/s relationship.

Work in progress (pre-alpha). Inspired by the [Virtual Corner Time](https://cornertime.herokuapp.com) application. I am in no way affiliated with the original application. This is a clean-room implementation with improvements over the original:

* Ultimately enabling one to **set all session parameters via a preset**, especially the session duration. This would enable one to set up a session for someone else without notifying them about the duration beforehand. Only local settings such as movement threshold (very dependant on the webcam and distance) are left for the person doing the session to configure.
* **Setting the session duration in terms of minimum time and maximum time**. The +/- 50% setting of the original application causes a very wide duration range, for example from 30 minutes to 90 minutes assuming a nominal time of 60 minutes.
* **Having a numeric input for session duration range** instead of a slider.

Frontend done in TypeScript & React. No backend. Session monitoring runs locally. A fixed webcam samples ten times per second. The movement percentage is the fraction of changed pixels in the busiest small region. Position compares the current scene with the end of preparation, so moving the camera or changing the background can also register a shift. Enable the microphone during a session to display its relative digital level (dBFS). Position and noise are informational. Movement uses the existing warning and cooldown rules.

## Challenge studio

Choose among 40 challenges in Movement, Position, Sound and Mixed. Open the stage guide for the sensor thresholds and hold times. Standard uses the listed base times. Extended and Endurance increase each stage goal by 50% and 100%, respectively. Daily pick rotates with the local date. Shuffle, search and favorites help find another course.

Start the challenge, allow camera access for visual goals, and press **Enable microphone** for sound or mixed courses. Position is relative to the scene captured at the end of the five-second preparation. Keep the camera fixed. Sound thresholds use microphone input level in dBFS. Sensor processing stays on the device. A sensor outage suspends scoring until enough readings are available again.

Timed stages bank successful seconds or require a consecutive streak. In the original courses, for stillness, position and sound stages, at least 80% of valid samples must satisfy the goal during a scored second. Movement pulses need one qualifying sample. Each second requires at least five readings. You can pause, resume, or end a challenge, and switching to a hidden tab pauses scoring automatically. Completed courses show accuracy, time and best streak. The most recent 50 results, favorites and per-difficulty fastest times are stored locally. Classic sessions, preset tools and reports remain available under **Classic tools**.

### Strict challenges

Select **Strict** in the challenge library to find the 20 additional courses. Every stage requires a consecutive hold. A scored second requires at least eight valid readings, and every reading must meet every target for that stage. A missed target, sensor gap, manual pause or automatic background pause clears the current hold and streak. Completed stages are retained. Sensor gaps and pauses add no scored time.

Strict courses include movement ceilings and bands, measured offsets from the starting scene, narrow microphone bands, and simultaneous camera and audio targets. Position is expressed as the number of changed tiles in the 192-tile camera view. The monitor shows the live count beside the position reading. Open the stage guide to see the thresholds and hold durations before starting. Standard, Extended and Endurance adjust hold lengths within each strict course.

## Try it out!

The GitHub Pages address for this project is [img2vid.github.io/cornertime](https://img2vid.github.io/cornertime/).

## Publish on GitHub Pages

Upload the extracted project contents, including the prebuilt `docs/` folder, to the root of `img2vid/cornertime`. In Settings → Pages, select **Deploy from a branch**, choose the branch containing the upload, select **/docs**, and save. After source changes, run `bash deploy.sh` and commit the refreshed `docs/` folder.

## Getting started

Node 11+ required.

    npm install
    npm start
    npm test

## TODO

* [ ] Ask for the user's name and reason for punishment when starting and include them in the report
* [ ] Calibration view
    * [ ] See the picture from the webcam to help aiming
    * [ ] Provide a visual indicator for current level of motion
    * [ ] Adjust the movement threshold
* [ ] Core functionality improvements
    * [ ] Add a configurable audible tick to tell the user the application is still working
    * [ ] Prevent computer from going to sleep while in session
* [ ] Custom punishment management
    * [ ] Edit the current preset via a UI
    * [X] Export the current preset
    * [X] Import a preset – *currently by pasting in the same field as the JSON. Rethink when we have the preset editor UI*
    * [ ] Select a preset from a list of default presets
* [ ] Encouragement functionality
    * [X] Randomly receive encouragement during session
    * [ ] Make encouragement occur more towards the end of a session
* [ ] Improvements under the hood
    * [ ] Throttle webcam capture rate to 10–30 fps or even lower to conserve battery and cause less heat
    * [ ] Consider rewriting the FSM with Redux or similar state management
    * [ ] Separate speech, time & other side effects from the FSM
    * [ ] Make sure there is no memory leaks

## Import/export format

While sharing presets and reports via links would be preferred, I have no intention to implement any kind of a backend, so they need to be self-contained.

Someone receiving a preset should not know the parameters contained within, so plain JSON is not acceptable. Fixed-width lines are easier to copy & paste.

To this end, we use base64 encoded JSON documents with a header and footer to identify the documents and make them easier to copy & paste.

Examples follow.

### Presets

    -----BEGIN CORNERTIME CUSTOM PUNISHMENT------
    eyJ0aXRsZSI6IkRlZmF1bHQiLCJkdXJhdGlvblJhbmdlIjp7Im1pbmltdW0iOjYwMCwibWF4aW11
    bSI6OTAwfSwicGVuYWx0eVJhbmdlIjp7Im1pbmltdW0iOjYwLCJtYXhpbXVtIjoxODB9LCJwZW5h
    bHR5UHJvYmFiaWxpdGllcyI6WzAsMV0sImVuY291cmFnZW1lbnRQcm9iYWJpbGl0eSI6MC4wNSwi
    cGhyYXNlcyI6eyJnZXRSZWFkeSI6WyJZb3UgaGF2ZSBiZWVuIG5hdWdodHkuIEdldCBpbiB0aGUg
    Y29ybmVyLiJdLCJzdGFydCI6WyJZb3UgYmV0dGVyIG5vdCBtb3ZlLiBJJ20gc3RhcnRpbmcgeW91
    ciBwdW5pc2htZW50IG5vdy4iXSwiZW5jb3VyYWdlIjpbIkp1c3QgYSBmZXcgbW9yZSBtaW51dGVz
    LiJdLCJzY29sZCI6WyJEbyBJIHNlZSB5b3UgbW92aW5nPyJdLCJwZW5hbGl6ZSI6WyJJIHdhcm5l
    ZCB5b3Ugbm90IHRvIG1vdmUuIEknbSBhZGRpbmcgc29tZSBtb3JlIG1pbnV0ZXPCoHRvIHRoZSBj
    bG9jay4iXSwiZW5kIjpbIllvdSBjYW4gY29tZSBvdXQgb2YgdGhlIGNvcm5lciBub3cuIl19fQo=
    ------END CORNERTIME CUSTOM PUNISHMENT------

### Reports

No attempt is made to make forging reports harder. It is trivially easy to cheat by covering the webcam anyway.

    -----BEGIN CORNERTIME PUNISHMENT REPORT-----
    eyJuYW1lIjoiQW5vbnltb3VzIiwicHJlc2V0VGl0bGUiOiJEZWZhdWx0IiwiaW5pdGlhbER1cmF0
    aW9uIjo5LCJ0b3RhbER1cmF0aW9uIjoxOSwic3RhcnRlZEF0IjoiMjAxOC0wMS0xNFQyMzowOTo1
    NC4zMjRaIiwiZXZlbnRzIjpbeyJhZGp1c3RtZW50IjowLCJldmVudFR5cGUiOiJnZXRSZWFkeSIs
    InRpbWUiOi0xMH0seyJhZGp1c3RtZW50IjowLCJldmVudFR5cGUiOiJzdGFydCIsInRpbWUiOjB9
    LHsiYWRqdXN0bWVudCI6MCwiZXZlbnRUeXBlIjoic2NvbGQiLCJ0aW1lIjoxfSx7ImFkanVzdG1l
    bnQiOjUsImV2ZW50VHlwZSI6InBlbmFsaXplIiwidGltZSI6N30seyJhZGp1c3RtZW50Ijo1LCJl
    dmVudFR5cGUiOiJwZW5hbGl6ZSIsInRpbWUiOjEzfSx7ImFkanVzdG1lbnQiOjAsImV2ZW50VHlw
    ZSI6ImVuZCIsInRpbWUiOjE5fV0sInZpb2xhdGlvbnMiOjN9Cg==
    -----END CORNERTIME PUNISHMENT REPORT-----
