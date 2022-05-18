import { Component } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { createInterceptor } from '@mswjs/interceptors'
import browserInterceptors from '@mswjs/interceptors/lib/presets/browser'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'angular-hello-world-app';

  constructor(private httpClient: HttpClient) {
    monkeyPatchXMLHttpRequest();
    monkeyPatchFetchApi();
  }

  makeHttpRequest(): void {
    this.httpClient.get("https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.13.3/underscore-min.js").subscribe(() => {
      console.log("google xmlhttprequest completed");
    });

    fetch(new Request("https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.13.3/underscore-min.js")).then(() => {
      console.log("google FETCH completed")
    });
  }

  registerApplicationRootHttpInterceptor() {

    const interceptor = createInterceptor({
      modules: browserInterceptors,
      resolver(request, ref) {
        // Optionally, return a mocked response.
      },
    });

    interceptor.apply();
    interceptor.on('request', (request) => {
      request.url.href = request.url.href.replace("underscore-min.js", "underscore-umd.min.js");
      console.log('soham [%s] %s', request.method, request.url.toString());
    })
  }
}
function monkeyPatchXMLHttpRequest() {
  if (window.XMLHttpRequest) {
    (function () {
      var proxied: any = window.XMLHttpRequest.prototype.open;
      (window.XMLHttpRequest.prototype.open as any) = function (this: XMLHttpRequest, method: string, url: any, isAsync: any, user: any, password: any) {
        if (typeof url === 'undefined') {
          url = method
          method = 'GET'
        }

        if (typeof isAsync === 'undefined') {
          isAsync = true;
        };

        if (url instanceof URL) {
          url.href = url.href.replace("underscore-min.js", "underscore-umd.min.js");
        }
        else if (typeof url === 'string') {
          url = url.replace("underscore-min.js", "underscore-umd.min.js");
        }
        return proxied.apply(this, [method, url, isAsync, user, password]);
      };
    })();
  }
}

function monkeyPatchFetchApi(): void {

  if (window.fetch) {
    const pureFetch = window.fetch;

    window.fetch = async (input, init) => {
      let url = typeof input === 'string' ? input : input.url
      url = url.replace("underscore-min.js", "underscore-umd.min.js");

      if (typeof input === 'string') {
        input = url;
      }

      let request = new Request(input, init);

      if (typeof input !== 'string') {
        request = new Request(url, request);
      }

      return pureFetch(request).then(async (response) => {
        return response
      });
    }
  }
}

