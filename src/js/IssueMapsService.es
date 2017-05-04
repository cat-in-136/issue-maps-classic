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

    return new Promise((resolve, reject) => {
      let url = this.getRedmineIssuesHomeAddress("json");
      $.ajax({
        method: "GET",
        url: url,
        data: {
          limit: 100
        },
        xhrFields: {
          withCredentials: true
        },
        beforeSend: (xhr) => {
          xhr.setRequestHeader("X-Redmine-API-Key", this.redmineAccessKey);
        }
      }).then((data, textStatus, jqXHR) => {
        this.issuesCache = {};
        data.issues.forEach((issue) => this.issuesCache[issue.id.toString()] = issue);

        resolve(IssueMapsService.formatIssues(data.issues));
      }).fail((data, textStatus, errorThrown) => {
        reject(new Error({data, textStatus, errorThrown}));
      });
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
      }
    }
    return {
      id: issue.id,
      latitude: issue.latitude,
      longitude: issue.longitude,
      status: issue.status.name,
      title: issue.subject,
      description: issue.description,
      author: issue.author.name,
      start_date: issue.start_date,
      due_date: issue.due_date,
      created_on: issue.created_on,
      category: issue.category && issue.category.name,
    };

  }
}
