class IssueMapsService {

  get isRedmineLoggedIn() {
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

  logout() {
    window.localStorage.removeItem("redmine-address");
    window.localStorage.removeItem("redmine-access-key");
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
      let url = `${this.redmineAddress}/issues.json`;
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
