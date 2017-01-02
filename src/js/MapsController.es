class MapsController {
  constructor({element}) {
    this.element = element;

    this.markers = [];
    this.infowin = new google.maps.InfoWindow();

    $(window).one("load", () => {
      this.map = new google.maps.Map(this.element, {
        center: { lat: 35.68519569653298, lng: 139.75278877116398 },
        zoom: 12,
      });
      this.apply();
    });
    $(window).on("resize", () => this.repaintMap());
  }

  apply() {
    if (!this.map) { return; }

    if (this.markers && this.markers.length > 0) {
      for (let marker of this.markers) {
        marker.setMap(null);
      }
    }

    this.markers = this.issues.map((issue) => {
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
          if (typeof(this.onmarkerclicked) === "function") {
            this.onmarkerclicked.call(this, {marker, issue, event});
          }
          event.preventDefault();
        });
        this.infowin.setContent(content.get(0));
        this.infowin.open(map, marker);
      });
      return marker;
    });
    this.repaintMap();
  }
  repaintMap() {
    if (this.map) {
      google.maps.event.trigger(this.map, "resize");
    }
  }
  gotoIssue(issue) {
    if (!issue) { return; }
    this.map.panTo({lat: parseFloat(issue.latitude), lng: parseFloat(issue.longitude)});
  }

  get issues() {
    return (this._issues || []);
  }
  set issues(value) {
    if (!value || typeof(value) === "array") { throw Error("Wrong issues"); }
    this._issues = value;
    this.apply();
  }
}
