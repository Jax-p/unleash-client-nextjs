import { getDefinitions } from "./getDefinitions";

const mockFetch = vi.fn();
const mockConsole = {
  warn: vi.fn(),
  error: vi.fn(),
};

describe("getDefinitions", () => {
  beforeAll(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("console", mockConsole);
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should fetch with default config", () => {
    mockFetch.mockResolvedValue({ json: () => ({ version: 1, features: [] }) });

    expect(getDefinitions()).resolves.toEqual({
      version: 1,
      features: [],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4242/api/client/features",
      {
        headers: {
          "Content-Type": "application/json",
          "UNLEASH-APPNAME": "nextjs",
          "User-Agent": "nextjs",
        },
      }
    );
  });

  it("should warn about default config", () => {
    getDefinitions();

    expect(mockConsole.warn).toHaveBeenCalled();
  });

  it("should show an warning when neither token nor instanceId is used", () => {
    getDefinitions();

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining("Neither token nor instanceId is used.")
    );
  });

  it("should read configuration from environment variables", () => {
    const url = "http://example.com/api";
    const token = "secure-token";
    const appName = "my-awesome-app";
    vi.stubEnv("NEXT_PUBLIC_UNLEASH_SERVER_API_URL", url);
    vi.stubEnv("UNLEASH_SERVER_API_TOKEN", token);
    vi.stubEnv("UNLEASH_APP_NAME", appName);

    getDefinitions();

    expect(mockFetch).toHaveBeenCalledWith(`${url}/client/features`, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        "UNLEASH-APPNAME": appName,
        "User-Agent": appName,
      },
    });

    expect(mockConsole.warn).not.toHaveBeenCalled();
    expect(mockConsole.error).not.toHaveBeenCalled();
  });

  it("is using UNLEASH_SERVER_API_URL and will prioritize it over NEXT_PUBLIC_UNLEASH_SERVER_API_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_UNLEASH_SERVER_API_URL", "http://example.com/api");
    vi.stubEnv("UNLEASH_SERVER_API_URL", "http://example.org/api");

    getDefinitions();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://example.org/api/client/features",
      expect.anything()
    );
  });
  it("should allow for overriding the default config", () => {
    const url = "http://example.com/api/client/features";
    const token = "secure-token";
    const appName = "my-awesome-app";

    getDefinitions({
      url,
      appName,
      token,
    });

    expect(mockFetch).toHaveBeenCalledWith(url, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        "UNLEASH-APPNAME": appName,
        "User-Agent": appName,
      },
    });

    expect(mockConsole.warn).not.toHaveBeenCalled();
    expect(mockConsole.error).not.toHaveBeenCalled();
  });
});
