class IssueMapsService {

  get isRedmineLoggedIn() {
    return !! this.redmineAccessKey
  }
  set redmineAccessKey(accessKey) {
    window.localStorage.setItem("redmine-access-key", accessKey);
  }
  get redmineAccessKey() {
    return window.localStorage.getItem("redmine-access-key");
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
      let url = IssueMapsClassicSetting.issues_url;
      $.ajax({
        method: "GET",
        url: url,
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
        if (c.name == "場所" && c.value) {
          [issue.latitude, issue.longitude] = c.value.split(",");
        }
      }
    }
    return {
      id: issue.id,
      latitude: issue.latitude,
      longitude: issue.longitude,
      title: issue.subject,
      description: issue.description,
      author: issue.author.name,
      start_date: issue.start_date,
      created_on: issue.created_on,
      category: issue.category && issue.category.name,
    };

  }
}
