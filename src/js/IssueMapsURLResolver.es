class IssueMapsURLResolver {
  constructor(service) {
    if (!service) { throw new Error("Service not initialized."); }
    this.service = service;
  }

  getIssueURL(issue, format="") {
    let url = undefined;
    if (format !== "") {
      url = `${this.service.redmineAddress}/issues/${issue.id}.${format}`;
    } else {
      url = `${this.service.redmineAddress}/issues/${issue.id}`;
    }
    return url;
  }
}
