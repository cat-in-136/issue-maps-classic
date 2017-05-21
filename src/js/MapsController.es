class MapsController {
  constructor({element, urlResolver}) {
    this.element = element;
    this.urlResolver = urlResolver;

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
        let url = this.urlResolver.getIssueURL(issue);
        let description = IssueMapsClassic.escapeHTML(issue.description);
        if (window.markdownit) {
          let md = window.markdownit({linkify: true});
          description = md.render(issue.description);
        }
        let content = $(`<div class="issue-popup"/>`).html(
          `<div class="issue-title"><a href="${url}">${IssueMapsClassic.escapeHTML(issue.title)}</a></div>
           <div class="issue-description">${description}</div>`
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

        if (typeof(this.onpopupwindowopened) === "function") {
          this.onpopupwindowopened({issue});
        }
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
  gotoIssue(issue, withAnimation=false) {
    if (!issue) { return; }

    let marker = this.markers.find((v, i) => this.issues[i] === issue);
    if (!marker) { throw new Error("Marker not found"); }

    this.map.panTo(marker.getPosition());
    if (withAnimation) {
      marker.setAnimation(google.maps.Animation.DROP);
    }
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
