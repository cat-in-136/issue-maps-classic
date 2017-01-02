class IssuesListController {
  constructor({list, searchText, searchTextLabel}) {
    this.listElem = list;
    this.searchTextElem = searchText;
    this.searchTextLabelElem = searchTextLabel;

    $(this.searchTextElem).on("change keyup", () => this.updateFilteredIssues());
    $(this.listElem).on("click", "[data-issue-id] .mdl-x-expansion-expander-button", (event) => {
      let listItem = $(event.target).parents("[data-issue-id]");
      this.selectedIssueId = (listItem.hasClass("is-active"))? -1 : parseInt(listItem.data("issue-id"));
    });
  }
  apply() {
    $(this.listElem).html(this.filteredIssues.map((issue) => {
      return IssuesListController.renderIssue({issue, isSelected: issue == this._selectedIssue});
    }).join(""));
  }
  updateSelectedIssue() {
    let previousActive = $(".is-active[data-issue-id]", this.listElem);
    
    if (((previousActive.length > 0) && (parseInt(previousActive.data("issue-id")) != this.selectedIssueId)) ||
        ((previousActive.length == 0) && this.selectedIssue)) {
      if (previousActive.length > 0) {
        let issue = this.issues.find((v) => v.id == parseInt(previousActive.data("issue-id")));
        previousActive.replaceWith(
          IssuesListController.renderIssue({issue, isSelected: false})
        );
      }
      if (this.selectedIssue) {
        $(`[data-issue-id="${this.selectedIssueId}"]`, this.listElem).replaceWith(
          IssuesListController.renderIssue({issue: this.selectedIssue, isSelected: true})
        );
      }

      if (typeof(this.onselectedissuechanged) === "function") {
        this.onselectedissuechanged.call(this, {selectedIssue: this.selectedIssue});
      }
    }
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
  static renderIssue({issue, isSelected=false}) {
    let url = encodeURI(IssueMapsClassicSetting.issue_url.replace(":id", issue.id).replace(".json", ""));

    let supportingText = "";
    if (isSelected) {
      let description = IssueMapsClassic.escapeHTML(issue.description);
      if (marked) {
         description = marked(issue.description);
      }

      supportingText = `<div class="mdl-color-text--black">
                          ${description}
                        </div>`;
      supportingText+= `<ul style="list-style: none; padding: 0;">`;
      if (issue.author && issue.created_on) {
        supportingText+= `<li>
                            ${IssueMapsClassic.escapeHTML(issue.author)}が
                            ${(new Date(issue.created_on)).toLocaleString()}に追加
                          </li>`;
      }
      if (issue.start_date || issue.end_date) {
        supportingText+= `<li>
                            ${IssueMapsClassic.escapeHTML(issue.start_date)}
                            〜
                            ${IssueMapsClassic.escapeHTML(issue.end_date)}
                          </li>`;
      }
      supportingText+= `</ul>`;
    } else {
      supportingText = IssueMapsClassic.escapeHTML((issue.description.length > 100)? (issue.description.substring(0, 97)+"...") : issue.description);
    }
    let activeClass = (isSelected)? " is-active" : "";

    return `<div class="mdl-x-expansion-panel mdl-cell mdl-cell--12-col mdl-shadow--2dp mdl-color--white ${activeClass}" data-issue-id="${issue.id}">
              <div class="mdl-card__title ${(isSelected)? ' mdl-color--indigo-100' : ''}">
                <h2 class="mdl-card__title-text"><a href="${url}">${IssueMapsClassic.escapeHTML(issue.title)}</a></h2>
              </div>
              <div class="mdl-card__supporting-text">
                ${supportingText}
              </div>
              <div class="mdl-card__menu">
                <button class="mdl-x-expansion-expander-button mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">
                  <i class="material-icons">${(isSelected)? 'expand_less' : 'expand_more'}</i>
                </button>
              </div>
            </div>`;
  }
  show() {
    return $(this.listElem)
      .add(this.searchTextElem)
      .add(this.searchTextLabelElem)
      .show("fast").promise();
  }
  hide() {
    return $(this.listElem)
      .add(this.searchTextElem)
      .add(this.searchTextLabelElem)
      .hide("fast").promise();
  }

  get issues() {
    return (this._issues || []);
  }
  set issues(value) {
    this._issues = value;
    this.selectedIssue = undefined;
    this.updateFilteredIssues();
  }
  get selectedIssue() {
    return this._selectedIssue || undefined;
  }
  set selectedIssue(value) {
    this._selectedIssue = value;
    this.updateSelectedIssue();
  }
  get selectedIssueId() {
    return (this.selectedIssue)? this.selectedIssue.id : -1;
  }
  set selectedIssueId(value) {
    this.selectedIssue = (value >= 0)? this.issues.find((v) => v.id == value) : undefined;
  }
  get filteredIssues() {
    return (this._filteredIssues || []);
  }
  set filteredIssues(value) {
    this._filteredIssues = value;
    this.selectedIssue = undefined;
    this.apply();
    if (typeof(this.onfilteredissuesupdated) === "function") {
      this.onfilteredissuesupdated.call(this, {filteredIssues: value});
    }
  }
}
