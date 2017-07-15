class IssuesListController {
  constructor({list, searchText, searchTextLabel, urlResolver}) {
    this.listElem = list;
    this.searchTextElem = searchText;
    this.searchTextLabelElem = searchTextLabel;
    this.searchTextDataList = $(searchText)[0].list;
    this.urlResolver = urlResolver;

    $(this.searchTextElem).on("change keyup", () => this.updateFilteredIssues());
    $(this.listElem).on("click", "[data-issue-id] .mdl-x-expansion-expander-button", (event) => {
      let listItem = $(event.target).parents("[data-issue-id]");
      this.selectedIssueId = (listItem.hasClass("is-active"))? -1 : parseInt(listItem.data("issue-id"));
    });
  }
  apply() {
    if (this.filteredIssues.length > 0) {
      $(this.listElem).html(this.filteredIssues.map((issue) => {
        return this.renderIssue({issue, isSelected: issue == this._selectedIssue});
      }).join(""));
    } else {
      $(this.listElem).html(`<div class="mdl-cell mdl-cell--12-col mdl-shadow--2dp">
        <div class="mdl-card__supporting-text">
          Issue Not Found
        </div>
      </div>`);
    }
  }
  updateSelectedIssue() {
    let previousActive = $(".is-active[data-issue-id]", this.listElem);
    
    if (((previousActive.length > 0) && (parseInt(previousActive.data("issue-id")) != this.selectedIssueId)) ||
        ((previousActive.length == 0) && this.selectedIssue)) {
      if (previousActive.length > 0) {
        let issue = this.issues.find((v) => v.id == parseInt(previousActive.data("issue-id")));
        previousActive.replaceWith(
          this.renderIssue({issue, isSelected: false})
        );
      }
      if (this.selectedIssue) {
        $(`[data-issue-id="${this.selectedIssueId}"]`, this.listElem).replaceWith(
          this.renderIssue({issue: this.selectedIssue, isSelected: true})
        );
      }

      if (typeof(this.onselectedissuechanged) === "function") {
        this.onselectedissuechanged.call(this, {selectedIssue: this.selectedIssue});
      }
    }
  }
  updateFilteredIssues() {
    let keyphrase = $.trim($(this.searchTextElem).val()).toLowerCase();
    let filteredIssues = this.issues.filter((issue) => {
      if (keyphrase.match(/^\s*$/)) {
        return true;
      } else if (keyphrase.match(/^id:([0-9]+)$/)) {
        return issue.id === parseInt(RegExp.$1);
      } else {
        let keyphrase_without_tag = keyphrase;
        if (keyphrase.match(/(category|カテゴリ):([^\s]+)/)) {
          if ((issue.category !== RegExp.$2.toLowerCase()) || (!issue.category && (RegExp.$2 === "null"))) {
            return false;
          }
          keyphrase_without_tag = $.trim(keyphrase_without_tag.replace(/(category|カテゴリ):([^\s]+)/, ""));
        }

        return [issue.title, issue.description, issue.author, issue.category].some((v) => {
          return (!!v) && ($.trim(v).toLowerCase().indexOf(keyphrase_without_tag) >= 0);
        });
      }
    });

    if (this._sortOrder && (this._sortOrder !== "id")) {
      filteredIssues = filteredIssues.sort((a, b) => (a[this._sortOrder] < b[this._sortOrder])? -1 : (a[this._sortOrder] > b[this._sortOrder])? +1 : 0);
    }
    this.filteredIssues = filteredIssues;
  }
  renderIssue({issue, isSelected=false}) {
    let url = this.urlResolver.getIssueURL(issue);

    let supportingText = "";
    if (isSelected) {
      let description = IssueMapsClassic.escapeHTML(issue.description);
      if (window.markdownit) {
        let md = window.markdownit({linkify: true});
        description = md.render(issue.description);
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
      if (issue.start_date || issue.due_date) {
        supportingText+= `<li>
                            ${IssueMapsClassic.escapeHTML(issue.start_date)}
                            〜
                            ${IssueMapsClassic.escapeHTML(issue.due_date)}
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
    if (this.searchTextDataList) {
      $(this.searchTextDataList).empty();
      let categories = [];
      for (let issue of this._issues) {
        let category = issue.category || "null";
        if (categories.indexOf(issue.category) < 0) {
          categories.push(issue.category);
          $(this.searchTextDataList).append($("<option>").attr("value", `category:${category}`));
          $(this.searchTextDataList).append($("<option>").attr("value", `カテゴリ:${category}`));
        }
      }
    }
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
  get sortOrder() {
    return (this._sortOrder || undefined);
  }
  set sortOrder(value) {
    this._sortOrder = value;
    this.updateFilteredIssues();
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
