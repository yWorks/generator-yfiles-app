## Usage
Open <% if (useGruntBundling) { %>dist/<% } else { %>app/<% } %><%= applicationName %>.html in a browser. 

<% if (useGruntBundling) { %>
## Building
Run
```sh
$ grunt
```
This will create a bundle of the app in dist/. 
<% if (useWebpack) { %>
To save time during development run
```sh
$ grunt build-dev
```
This will leave out the minimizing/optimizing step.
<% } %>
You can also start a development server + watch task:
```sh
$ grunt dev-server
```<%
} %>
