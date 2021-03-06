class IssueMapsClassic {
  constructor() {
    this.service = new IssueMapsService();
    this.urlResolver = new IssueMapsURLResolver(this.service);
    this.mapController = new MapsController({element: $("#map")[0], urlResolver: this.urlResolver});
    this.issuesListController = new IssuesListController({list: "#issuesList", searchText: "#issueSearch", searchTextLabel: "label[for=issueSearch]", issueStatusFilterName: "issue_status_filter", urlResolver: this.urlResolver});

    $("dialog").each(function () {
      if (! this.showModal) {
        dialogPolyfill.registerDialog(this);
      }
    });
    this.mapController.onmarkerclicked = ({issue}) => {
      this.state = `id:${issue.id}`;
    };
    this.issuesListController.onfilteredissuesupdated = () => {
      this.mapController.issues = this.issuesListController.filteredIssues;
    };
    this.issuesListController.onselectedissuechanged = ({selectedIssue: issue}) => {
      if (issue) { this.mapController.gotoIssue(issue, true); }
      this.state = (issue)? `id:${issue.id}` : null;
    };
    this.mapController.onpopupwindowopened = ({issue}) => {
      this.state = (issue)? `id:${issue.id}` : null;
    };

    $("[for=orderButton] .mdl-menu__item").on("click", (event) => {
      let key = event.target.getAttribute("data-key");
      this.issuesListController.sortOrder = key;
    });

    $("#logoutRedmine").on("click", () => {
      this.service.logout().then(() => {
        this.issuesListController.issues = [];
        this.issues = [];
        this.updateDrawer();
        this.start();
      });
    });

    this.start();
  }
  start() {
    this.service.fetchRedmineIssues().then((data) => {
      //this.mapController.issues = data;
      this.issuesListController.issues = data;
      this.issues = data;
      this.updateDrawer();
    }).catch((ex) => {
      console.error(ex);
      this.retriveNewRedmineAddressKey().then(() => this.start()).catch(() => this.start());
    });
  }
  retriveNewRedmineAddressKey() {
    return new Promise((resolve, reject) => {
      let dialog = $("#redmineAddressKeyDialog")[0];
      dialog.showModal();
      $("#redmineKey").focus();
      $("#logoutRedmine").attr("disabled", true);

      $("#redmineAddressKeyDialog form[method=dialog]").one("submit", (event) => {
        event.preventDefault();
        dialog.close();
      });
      $(dialog).one("close", () => {
        let address = $("#redmineAddress").val().trim();
        let key = $("#redmineKey").val().trim();
        let projectID = $("#redmineProjectID").val().trim();
        if ((address === "") || (key === "")) { window.setTimeout(() => reject(), 1000); }
        this.service.redmineAddress = address;
        this.service.redmineAccessKey = key;
        this.service.redmineProjectID = (projectID === "")? undefined : projectID;
        $("#logoutRedmine").attr("disabled", false);

        window.setTimeout(() => resolve(address, key), 1000);
      });
    });
  }

  updateDrawer() {
    let redmineAddress = this.service.redmineAddress;
    if (redmineAddress) {
      let redmineIssuesHomeAddress = this.service.getRedmineIssuesHomeAddress();
      $("#redmineAddressHome").prop("href", redmineIssuesHomeAddress).text(redmineAddress.replace(/(file|https)?:\/\//, ""));
      $("#logoutRedmine").attr("disabled", false);
    } else {
      $("#redmineAddressHome").prop("href", "").text("N/A");
      $("#logoutRedmine").attr("disabled", true);
    }
  }

  set state(value) {
    this._state = value;
    if (/^id:([0-9]+)$/.test(value || "")) {
      try {
        let id = parseInt(RegExp.$1);
        let issue = this.issues.find((v) => v.id == id);
        this.issuesListController.selectedIssue = issue;
      } catch (ex) {
        console.error(ex);
        this.state = null; // fallback
      }
    } else {
      this.mapController.issues = this.issuesListController.filteredIssues;
      this.issuesListController.selectedIssue = undefined;
      this._state = null;
    }
  }

  static escapeHTML(val) {
    return $("<div />").text(val).html();
  }
}
