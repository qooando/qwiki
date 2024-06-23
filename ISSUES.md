- [ ] Implement custom template engine
    - [ ] Parser
    - [ ] Renderer

- [ ] If I remove metadata from a file and save the file, the db updates but the metadata in the files disappears until
  the next restart

- [ ] Substitute data files with the script does not update db

  > It seems related to one simple thing
  > 1. start inotifywait on a folder
  > 2. remove it
  > 3. recreate it
  > 4. inotifywait not working
       > how to fix: check for folder deletion and restart inotifywait ?
    