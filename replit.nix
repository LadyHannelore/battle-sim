
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.libuuid
    pkgs.cairo
    pkgs.pango
    pkgs.librsvg
    pkgs.pixman
    pkgs.pkg-config
  ];
}
