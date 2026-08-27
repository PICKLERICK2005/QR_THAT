function compileCatalog(catalog) {
  if (
    !catalog?.providers ||
    typeof catalog.providers !== "object" ||
    Array.isArray(catalog.providers)
  ) {
    throw new TypeError("Invalid rules catalog");
  }

  return Object.entries(catalog.providers).map(([name, provider]) => {
    if (
      !provider ||
      typeof provider !== "object" ||
      Array.isArray(provider) ||
      typeof provider.urlPattern !== "string" ||
      (provider.completeProvider !== undefined &&
        typeof provider.completeProvider !== "boolean") ||
      (provider.forceRedirection !== undefined &&
        typeof provider.forceRedirection !== "boolean")
    ) {
      throw new TypeError("Invalid provider");
    }

    const compileList = (values, flags = "i") => {
      if (values === undefined) {
        return [];
      }
      if (!Array.isArray(values) || values.some((value) => typeof value !== "string")) {
        throw new TypeError("Invalid provider rules");
      }
      return values.map((value) => new RegExp(value, flags));
    };

    return {
      name,
      completeProvider: provider.completeProvider === true,
      urlPattern: new RegExp(provider.urlPattern, "i"),
      rules: [
        ...compileList(provider.rules),
        ...compileList(provider.referralMarketing),
      ],
      rawRules: compileList(provider.rawRules, "gi"),
      exceptions: compileList(provider.exceptions),
      redirections: compileList(provider.redirections),
    };
  });
}

export function validateRulesCatalog(catalog) {
  if (compileCatalog(catalog).length < 10) {
    throw new TypeError("Rules catalog is unexpectedly small");
  }
  return true;
}

function decodeRedirect(value) {
  const decoded = decodeURIComponent(value);

  if (!decoded.startsWith("http")) {
    decoded = `http://${decoded}`;
  }

  const url = new URL(decoded);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("Unsupported redirect URL");
  }
  return decoded;
}

export function sanitizeUrl(originalUrl, catalog) {
  const fallback = {
    originalUrl,
    resultUrl: originalUrl,
    changed: false,
    providers: [],
    completeProvider: false,
  };

  try {
    if (typeof originalUrl !== "string" || originalUrl.length === 0) {
      return fallback;
    }

    const initialUrl = new URL(originalUrl);
    if (initialUrl.protocol !== "http:" && initialUrl.protocol !== "https:") {
      return fallback;
    }

    const providers = compileCatalog(catalog);
    const appliedProviders = new Set();
    const visited = new Set([originalUrl]);
    let currentUrl = originalUrl;

    for (let pass = 0; pass < 20; pass += 1) {
      let changedThisPass = false;

      for (const provider of providers) {
        if (!provider.urlPattern.test(currentUrl)) {
          continue;
        }
        if (provider.exceptions.some((exception) => exception.test(currentUrl))) {
          continue;
        }

        let redirected = false;
        for (const redirection of provider.redirections) {
          const match = redirection.exec(currentUrl);
          if (!match?.[1]) {
            continue;
          }

          const destination = decodeRedirect(match[1]);
          if (visited.has(destination)) {
            throw new TypeError("Redirection cycle");
          }

          visited.add(destination);
          currentUrl = destination;
          appliedProviders.add(provider.name);
          changedThisPass = true;
          redirected = true;
          break;
        }

        if (redirected) {
          break;
        }

        if (provider.completeProvider) {
          return {
            ...fallback,
            completeProvider: true,
            providers: [provider.name],
          };
        }

        let cleanedUrl = currentUrl;
        for (const rawRule of provider.rawRules) {
          cleanedUrl = cleanedUrl.replace(rawRule, "");
        }

        const parsedUrl = new URL(cleanedUrl);
        let providerChanged = cleanedUrl !== currentUrl;

        for (const key of [...new Set(parsedUrl.searchParams.keys())]) {
          if (provider.rules.some((rule) => new RegExp(`^(?:${rule.source})$`, "i").test(key))) {
            parsedUrl.searchParams.delete(key);
            providerChanged = true;
          }
        }

        if (parsedUrl.hash) {
          const fragments = parsedUrl.hash.slice(1).split("&");
          const keptFragments = fragments.filter((fragment) => {
            const key = fragment.split("=", 1)[0];
            return !provider.rules.some((rule) =>
              new RegExp(`^(?:${rule.source})$`, "i").test(key),
            );
          });

          if (keptFragments.length !== fragments.length) {
            parsedUrl.hash = keptFragments.join("&");
            providerChanged = true;
          }
        }

        if (providerChanged) {
          currentUrl = parsedUrl.href;
          appliedProviders.add(provider.name);
          changedThisPass = true;
          break;
        }
      }

      if (!changedThisPass) {
        return {
          originalUrl,
          resultUrl: currentUrl,
          changed: currentUrl !== originalUrl,
          providers: [...appliedProviders],
          completeProvider: false,
        };
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}
