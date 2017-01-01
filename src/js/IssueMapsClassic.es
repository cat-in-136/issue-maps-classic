class IssueMapsClassic {
  constructor(setting) {
    this.setting = setting;
    this.service = new IssueMapsService();
    this.mapController = new MapsController({element: $("#map")[0]});
    this.issuesListController = new IssuesListController({list: "#issuesList", searchText: "#issueSearch"});

    $("dialog").each(function () {
      if (! this.showModal) {
        dialogPolyfill.registerDialog(this);
      }
    });
    this.mapController.onmarkerclicked = ({issue}) => {
      $("#issueSearch").val(`id:${issue.id}`).select().trigger("change");
    };
    this.issuesListController.onfilteredissuesupdated = () => {
      this.mapController.issues = this.issuesListController.filteredIssues;
    };

    this.service.fetchRedmineIssues().then((data) => {
      //this.mapController.issues = data;
      this.issuesListController.issues = data;
    }).catch((ex) => {
      console.error(ex);
      this.retriveNewRedmineKey().then(() => this.start()).catch(() => this.start());
    });
  }
  retriveNewRedmineKey() {
    return new Promise((resolve, reject) => {
      let dialog = $("#redmineKeyDialog")[0];
      dialog.showModal();
      $("#redmineKey").focus();

      $("#redmineKeyDialog form[method=dialog]").one("submit", (event) => {
        event.preventDefault();
        dialog.close();
      });
      $(dialog).one("close", () => {
        let key = $("#redmineKey").val().trim();
        if (key === "") { window.setTimeout(() => reject(), 1000); }
        this.service.redmineAccessKey = key;
        window.setTimeout(() => resolve(key), 1000);
      });
    });
  }
  static escapeHTML(val) {
    return $("<div />").text(val).html();
  }
}
