const express = require('express');
const fs = require('fs');
const {exec} = require('child_process');
const org = require('org');

const app = express();
const port = 4000;

const stream = fs.createWriteStream("bookmarks.txt", {flags:'a'});

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const parser = new org.Parser();

const parseOrg = (str) => {
    const orgDoc = parser.parse(str);
    const orgHtml = orgDoc.convert(org.ConverterHTML, {
        headerOffset: 1,
        exportFromLineNumber: false,
        suppressSubScriptHandling: false,
        suppressAutoLink: false
    });
    const htmlStr = orgHtml.toString();
    return htmlStr;
};

const createStr = (data) => {
    const heading =`[[${data.url}][${data.title}]]`;
    const description = data.description ? data.description : undefined;
    const tags = data.tags.split(" ").reduce((acc,curr) => {
        return acc + ` :${curr}:`;
    },"");

    if(data.description) {
        return `
* ${heading}${tags}
** ${description}
`;
    }else {
        return `
* ${heading}${tags}
`;
    }

};

//This is simple script currently in use
// awk '/result/' RS= bookmarks.txt  ---command for searching

app.post('/', (req,res) => {
    stream.write(createStr(req.body));
    res.send(req.body.url);
});

//This puts line breaks between results
// const awkScript = `/${q}/ {do_print=1}
// do_print==1 {print}
// NF==0 {do_print=0}`

app.get('/search/:searchParam', async (req,res) => {
    const bookmarksFile = await fs.promises.readFile(__dirname + '/bookmarks.txt', 'utf8');
    const q = req.query.q;
    exec(`awk '/${req.params.searchParam}/' RS= bookmarks.txt `,(err, stdout, stderr) => {
        if(err) {
            console.log(err);
        } else {
            // res.send(parseOrg(stdout));
            res.send(`<pre>${stdout}</pre>`);
        }
    });

});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
