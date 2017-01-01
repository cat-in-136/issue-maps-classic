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

class IssueMapsClassic {
  constructor(setting) {
    this.setting = setting;
    this.service = new IssueMapsService();

    $("dialog").each(function () {
      if (! this.showModal) {
        dialogPolyfill.registerDialog(this)
      }
    });
    $(window).one("load", () => {
      this.map = new google.maps.Map($("#map")[0], {
        center: { lat: 35.68519569653298, lng: 139.75278877116398 },
        zoom: 12,
      });

      this.start();
    });
    $(window).on("resize", () => this.repaintMap());
  }
  start() {
    this.markers = [];
    this.infowin = new google.maps.InfoWindow();

    this.service.fetchRedmineIssues().then((data) => {
      this.markers = data.map((issue) => {
        let marker = new google.maps.Marker({
          position: {lat: parseFloat(issue.latitude), lng: parseFloat(issue.longitude)},
          map: this.map,
          title: issue.title
        });
        google.maps.event.addListener(marker, "click", (event) => {
          let url = encodeURI(IssueMapsClassicSetting.issue_url.replace(":id", issue.id).replace(".json", ""));
          let content = $("<div />").html(
            `<div class="issue-title"><a href="${url}">${IssueMapsClassic.escapeHTML(issue.title)}</a></div>
             <div class="issue-description">${IssueMapsClassic.escapeHTML(issue.description)}</div>`
          );
          $("a[href]", content).on("click", (event) => {
            this.infowin.close();
            $("#issueSearch").val(`id:${issue.id}`).trigger("change");
            event.preventDefault();
          });
          this.infowin.setContent(content.get(0));
          this.infowin.open(map, marker);
        });
        return marker;
      });

      $("#issueSearch").on("change keyup", () => this.updateIssueList(data));
      this.updateIssueList(data);
    }).catch((ex) => {
      console.error(ex);
      this.retriveNewRedmineKey().then(() => this.start()).catch(() => this.start());
    });

    window.setTimeout(() => $(window).trigger("resize"), 5000);
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
  repaintMap() {
    if (this.map) {
      google.maps.event.trigger(this.map, "resize");
    }
  }
  updateIssueList(data) {
    let keyphrase = $.trim($("#issueSearch").val()).toLowerCase();

    $("#issuesList ul").html(data.filter((issue) => {
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
    }).map((issue) => {
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
  static escapeHTML(val) {
    return $("<div />").text(val).html();
  }
}

$(() => {
  new IssueMapsClassic(IssueMapsClassicSetting);
});
