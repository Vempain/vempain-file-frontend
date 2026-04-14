type AxiosHeadersMap = Record<string, string>;

interface MockAxiosDefaults {
    headers: {
        get: AxiosHeadersMap;
        post: AxiosHeadersMap;
        put: AxiosHeadersMap;
        delete: AxiosHeadersMap;
    };
}

interface MockAxiosResponse<T> {
    data: T;
}

interface MockAxiosInstance {
    defaults: MockAxiosDefaults;
    get: jest.Mock<Promise<MockAxiosResponse<unknown>>, unknown[]>;
    post: jest.Mock<Promise<MockAxiosResponse<unknown>>, unknown[]>;
    put: jest.Mock<Promise<MockAxiosResponse<unknown>>, unknown[]>;
    delete: jest.Mock<Promise<MockAxiosResponse<unknown>>, unknown[]>;
}

function createAxiosMock(): MockAxiosInstance {
    return {
        defaults: {
            headers: {
                get: {},
                post: {},
                put: {},
                delete: {},
            },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    };
}

export const axiosMock = createAxiosMock();
export const constructorSpy = jest.fn<void, [string, string]>();
export const setAuthorizationHeaderSpy = jest.fn<void, []>();

export function resetServiceMockState(): void {
    constructorSpy.mockClear();
    setAuthorizationHeaderSpy.mockClear();

    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.put.mockReset();
    axiosMock.delete.mockReset();

    axiosMock.defaults.headers.get = {};
    axiosMock.defaults.headers.post = {};
    axiosMock.defaults.headers.put = {};
    axiosMock.defaults.headers.delete = {};
}

jest.mock("@vempain/vempain-auth-frontend", () => {
    abstract class MockAbstractAPI<REQUEST, RESPONSE> {
        protected axiosInstance: MockAxiosInstance;

        protected constructor(baseURL: string, member: string) {
            constructorSpy(baseURL, member);
            this.axiosInstance = axiosMock;
        }

        public async findAll(params?: Record<string, unknown>): Promise<RESPONSE[]> {
            this.setAuthorizationHeader();
            this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
            const response = await this.axiosInstance.get("", {params});
            return response.data as RESPONSE[];
        }

        public async findPageable(params?: Record<string, unknown>) {
            this.setAuthorizationHeader();
            this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
            const response = await this.axiosInstance.get("", {params});
            return response.data;
        }

        public async findById(id: number, parameters: string | null = null): Promise<RESPONSE> {
            this.setAuthorizationHeader();
            this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
            const suffix = parameters ? parameters : "";
            const response = await this.axiosInstance.get(`/${id}${suffix}`);
            return response.data as RESPONSE;
        }

        public async create(payload: REQUEST): Promise<RESPONSE> {
            this.setAuthorizationHeader();
            this.axiosInstance.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
            const response = await this.axiosInstance.post("", payload);
            return response.data as RESPONSE;
        }

        public async update(payload: REQUEST): Promise<RESPONSE> {
            this.setAuthorizationHeader();
            this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
            const response = await this.axiosInstance.put("", payload);
            return response.data as RESPONSE;
        }

        public async delete(id: number): Promise<boolean> {
            this.setAuthorizationHeader();
            this.axiosInstance.defaults.headers.delete["Content-Type"] = "application/json;charset=utf-8";
            const response = await this.axiosInstance.delete(`/${id}`);
            return response.data as boolean;
        }

        protected setAuthorizationHeader(): void {
            setAuthorizationHeaderSpy();
        }
    }

    return {
        AbstractAPI: MockAbstractAPI,
    };
}, {virtual: true});


