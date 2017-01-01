class IssuesListController {
  constructor({list, searchText}) {
    this.listElem = list;
    this.searchTextElem = searchText;

    $(this.searchTextElem).on("change keyup", () => this.updateFilteredIssues());
  }
  apply() {
    $("ul", this.listElem).html(this.filteredIssues.map((issue) => {
      let url = encodeURI(IssueMapsClassicSetting.issue_url.replace(":id", issue.id).replace(".json", ""));

      return `<li class="mdl-list__item mdl-list__item--three-line">
                <span class="mdl-list__item-primary-content">
                  <a href="${url}">${IssueMapsClassic.escapeHTML(issue.title)}</a>
                  <span class="mdl-list__item-text-body">
                    ${IssueMapsClassic.escapeHTML(issue.description)}
                  </span>
                </span>
              </li>`;
    }).join(""));
  }
  updateFilteredIssues() {
    let keyphrase = $.trim($(this.searchTextElem).val()).toLowerCase();
    this.filteredIssues = this.issues.filter((issue) => {
      if (keyphrase.match(/^\s*$/)) {
        return true;
      } else if (keyphrase.match(/^id:([0-9]+)$/)) {
        return issue.id === parseInt(RegExp.$1);
      } else {
        if (keyphrase.match(/category:([\s]+)/)) {
          if (issue.category !== RegExp.$1.toLowerCase()) {
            return false;
          }
          keyphrase = $.trim(keyphrase.replace(/category:([\s]+)/, ""));
        }

        return [issue.title, issue.description, issue.author, issue.category].some((v) => {
          return (!!v) && ($.trim(v).toLowerCase().indexOf(keyphrase) >= 0);
        });
      }
    });
  }

  get issues() {
    return (this._issues || []);
  }
  set issues(value) {
    this._issues = value;
    this.updateFilteredIssues();
  }
  get filteredIssues() {
    return (this._filteredIssues || []);
  }
  set filteredIssues(value) {
    this._filteredIssues = value;
    this.apply();
    if (typeof(this.onfilteredissuesupdated) === "function") {
      this.onfilteredissuesupdated.call(this, {filteredIssues: value});
    }
  }
}
