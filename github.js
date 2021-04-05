let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let $;
const { jsPDF } = require("jspdf");

let data = {};

request("https://github.com/topics", getTopicPage);

function getTopicPage(err, res, body) {
  if (!err) {
    $ = cheerio.load(body);
    let allTopicAnchors = $(
      ".no-underline.d-flex.flex-column.flex-justify-center"
    );

    let allTopicName = $(
      ".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1"
    );

    for (let i = 0; i < allTopicAnchors.length; i++) {
      fs.mkdirSync($(allTopicName[i]).text().trim());
      getAllProjects(
        "https://github.com/" + $(allTopicAnchors[i]).attr("href"),
        $(allTopicName[i]).text().trim()
      );
    }
  }
}

function getAllProjects(url, name) {
  request(url, function (err, res, body) {
    $ = cheerio.load(body);
    let allProjects = $(
      ".f3.color-text-secondary.text-normal.lh-condensed .text-bold"
    );
    if (allProjects.length > 8) {
      allProjects = allProjects.slice(0, 8);
    }

    for (let i = 0; i < allProjects.length; i++) {
      let projectUrl = "https://github.com" + $(allProjects[i]).attr("href");
      let projectName = $(allProjects[i]).text().trim();

      if (!data[name]) {
        data[name] = [{ projectName, projectUrl }];
      } else {
        data[name].push({ projectName, projectUrl });
      }

      getIssues(projectUrl, projectName, name);
    }
  });
}

function getIssues(url, projectName, topicName) {
  request(url + "/issues", function (err, res, body) {
    $ = cheerio.load(body);
    let allIssues = $(
      ".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title"
    );

    for (let i = 0; i < allIssues.length; i++) {
      let IssueTitle = $(allIssues[i]).text().trim();
      let IssueUrl = "https://github.com" + $(allIssues[i]).attr("href");

      let indx = data[topicName].findIndex(function (e) {
        return e.projectName == projectName;
      });

      if (!data[topicName][indx].issues) {
        data[topicName][indx].issues = [{ IssueTitle, IssueUrl }];
      } else {
        data[topicName][indx]["issues"].push({ IssueTitle, IssueUrl });
      }
      // fs.writeFileSync("data.json", JSON.stringify(data));
    }
    pdfGenerator();
  });
}

function pdfGenerator() {
  for (x in data) {
    let tArr = data[x];
    for (y in tArr) {
      let pName = tArr[y].projectName;
      if (fs.existsSync(`${x}/${pName}.pdf`))
      fs.unlinkSync(`${x}/${pName}.pdf`);
      const doc = new jsPDF();
      for (z in tArr[y].issues) {
        doc.text(tArr[y].issues[z].IssueTitle, 10, 10 + 15 * z);
        doc.text(tArr[y].issues[z].IssueUrl, 10, 15 + 15 * z);
      }
      doc.save(`${x}/${pName}.pdf`);
      // x+"/"+pName+".pdf"
    }
  }
}
