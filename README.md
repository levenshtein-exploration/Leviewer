# Leviewier

A viewer for Levenshtein neighborhood.

## Start the server

```bash
  python3 -m http.server <port>
```

## Page composition

### Header for data loading

Data are stored on the server in a data directory as tsv files.
The tsv files are listed in file_list.txt.
To add a new dataset, you have to add the tsv file in the data directory and add the filename in the file list.

The tsv format is as follow
```
  word1 k1 k2 k3 ...
  word2 k1 k2 k3 ...
```

To use the tsv parser correctly from other parts of the webpage, please refer to [the wiki](https://github.com/levenshtein-exploration/Leviewier/wiki/File-loader-documentation)


### D3js data visualzation

Work in progress
