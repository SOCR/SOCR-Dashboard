SOCR Analytics Dashboard
=============
The SOCR Analytics Dashboard is an integrated Big-Data analytics suite designed for wab based merging, integration, and analysis of large, heterogenous datasets. The package features a non-relational databse for storage and integration of heterogenous datasets, a javascript-based web server built using node.js, and a sleek front-end for visualization and real-time manipulation of data.

Sample Demo:
<a href="http://www.youtube.com/watch?feature=player_embedded&v=EDTDek1TqrU
" target="_blank"><img src="http://img.youtube.com/vi/EDTDek1TqrU/0.jpg" 
 width="240" height="180" border="10" /></a>


Setting up the Dashboard
==========================

1. ensure the [node framework](https://nodejs.org/en/) has been installed
2. in a command prompt navigate to the *server/mongodb/bin* folder, and run mongod: `mongod --dbpath ../data`

2. navigate to the root directory of the project in node, and run `npm install`

2. once dependencies are installed, launch node server: `npm start`

3. navigate to selected address in browser to launch webapp (default is [http://localhost:3000/](http://localhost:3000/))
