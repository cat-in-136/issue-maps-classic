class IssueMapsService {

  get isRedmineLoggedIn() {
    // redmineAddress, redmineAccessKey : mandatory; redmineProjectID : optional
    return (!! this.redmineAddress) && (!! this.redmineAccessKey);
  }
  set redmineAddress(address) {
    window.localStorage.setItem("redmine-address", address);
  }
  get redmineAddress() {
    return window.localStorage.getItem("redmine-address");
  }

  set redmineAccessKey(accessKey) {
    window.localStorage.setItem("redmine-access-key", accessKey);
  }
  get redmineAccessKey() {
    return window.localStorage.getItem("redmine-access-key");
  }

  set redmineProjectID(projectID) {
    if (!projectID || (projectID === "")) {
      window.localStorage.removeItem("redmine-project-id");
    } else {
      window.localStorage.setItem("redmine-project-id", projectID);
    }
  }
  get redmineProjectID() {
    return window.localStorage.getItem("redmine-project-id");
  }

  logout() {
    window.localStorage.removeItem("redmine-address");
    window.localStorage.removeItem("redmine-access-key");
    window.localStorage.removeItem("redmine-project-id");
    return Promise.resolve();
  }
  login() {
    return this.retriveNewRedmineKey().then((key) => {
      console.debug(key);
    });
  }
  fetchRedmineIssues() {
    if (!this.isRedmineLoggedIn) {
      return Promise.reject(new Error("Login required"));
    }

    let issues = [];
    let ajaxRedmineIssues = (data, extra) => new Promise((resolve, reject) => {
      let url = this.getRedmineIssuesHomeAddress("json");
      return $.ajax({
        method: "GET",
        url: url,
        data: data,
        xhrFields: {
          withCredentials: true
        },
        beforeSend: (xhr) => {
          xhr.setRequestHeader("X-Redmine-API-Key", this.redmineAccessKey);
        }
      }).then((data, textStatus, jqXHR) => {
        data.issues.forEach((issue) => {
          Object.keys(extra || {}).forEach((key) => issue[key] = extra[key]);
          issues.push(issue);
        });
        resolve(data);
      }).fail((data, textStatus, errorThrown) => {
        reject(new Error({data, textStatus, errorThrown}));
      });
    });

    let limit = 100;
    return ["open", "closed"].reduce((promise, status_id) => {
      return ajaxRedmineIssues({limit, status_id}, {status_id}).then((data) => {
        let promisePagination = [];
        for (let offset = limit; offset < data.total_count; offset += limit) {
          promisePagination.push(ajaxRedmineIssues({limit, offset, status_id}, {status_id}));
        }
        return Promise.all(promisePagination);
      });
    }, Promise.resolve([])).then(() => {
      this.issuesCache = {};
      issues.forEach((issue) => this.issuesCache[issue.id.toString()] = issue);
      return Promise.resolve(IssueMapsService.formatIssues(issues));
    });
  }

  getRedmineIssuesHomeAddress(format="") {
    let url = undefined;
    if (this.isRedmineLoggedIn) {
      url = (!this.redmineProjectID || (this.redmineProjectID === ""))?
        `${this.redmineAddress}/issues` :
        `${this.redmineAddress}/projects/${this.redmineProjectID}/issues`;
    }
    if (url && format) {
      url += `.${format}`;
    }
    return url;
  }

  static formatIssues(issues) {
    return issues.map(IssueMapsService.formatIssue).filter((issue) => issue.latitude);
  }
  static formatIssue(issue) {
    if (issue.custom_fields) {
      for (var c of issue.custom_fields) {
        if ((c.name == "場所" || c.name.toLowerCase() == "place") && c.value) {
          [issue.latitude, issue.longitude] = c.value.split(",");
        }
        if ((c.name == "実施日" || c.name.toLowerCase() == "execution date") && c.value) {
          issue.execution_date = c.value;
        }
      }
    }
    return {
      id: issue.id,
      latitude: issue.latitude,
      longitude: issue.longitude,
      status: issue.status.name,
      is_open: issue.status_id === "open",
      title: issue.subject,
      description: issue.description,
      author: issue.author.name,
      start_date: issue.start_date,
      due_date: issue.due_date,
      created_on: issue.created_on,
      execution_date: issue.execution_date,
      category: issue.category && issue.category.name,
    };

  }
}
