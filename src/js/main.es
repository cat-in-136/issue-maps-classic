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
        beforeSend: function(xhr) {
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
    for (var c of issue.custom_fields) {
      if (c.name == "場所" && c.value) {
        [issue.latitude, issue.longitude] = c.value.split(",");
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
    this.start();
    $(window).on("resize", () => {
      $("#map").width("100%").height($(window).height() - $(".navbar").height() - 10);
    });
    $(".navbar-collapse").on("shown.bs.collapse hidden.bs.collapse", () => $(window).trigger("resize"));
    $(window).trigger("resize");
  }
  start() {
    this.map = new google.maps.Map($("#map")[0], {
      center: { lat: 35.68519569653298, lng: 139.75278877116398 },
      zoom: 12,
    });
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
          let content = `<div class="issue-title"><a href="${url}">${IssueMapsClassic.escapeHTML(issue.title)}</a></div>
                         <div class="issue-description">${IssueMapsClassic.escapeHTML(issue.description)}</div>`;
          this.infowin.setContent(content);
          this.infowin.open(map, marker);
        });
        return marker;
      });
    }).catch(() => {
      this.retriveNewRedmineKey().then(() => this.start()).catch(() => this.start());
    });
  }
  retriveNewRedmineKey() {
    return new Promise((resolve, reject) => {
      $("#redmineKeyDialog").modal("show");
      $("#redmineKey").focus();

      $("#redmineKeyDialog").one("hide.bs.modal", () => {
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

$(() => {
  new IssueMapsClassic(IssueMapsClassicSetting);
});
