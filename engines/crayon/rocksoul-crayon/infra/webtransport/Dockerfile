FROM golang:1.25-bookworm AS build
WORKDIR /src
COPY server/go.mod ./
COPY server/ ./
RUN go mod tidy
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/webtransport-server .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/webtransport-server /webtransport-server
EXPOSE 6121/udp
USER nonroot:nonroot
ENTRYPOINT ["/webtransport-server"]
