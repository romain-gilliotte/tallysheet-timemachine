###################################
# Build stage
###################################

FROM node:12-alpine as build

WORKDIR /app
ENV LANG=C.UTF-8

# Install required packages
RUN apk --no-cache add \
    # Build tools
    bash \
    build-base \
    ca-certificates \
    clang-dev \
    clang \
    cmake \
    coreutils \
    curl \ 
    gcc \
    g++ \
    git \
    gettext \
    linux-headers \
    make \
    unzip \
    # For node-gyp (install of opencv4node)
    python \
    # For OpenCV
    freetype-dev \
    ffmpeg-dev \
    ffmpeg-libs \
    lcms2-dev \
    libavc1394-dev \
    libc-dev \
    libffi-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libressl-dev \
    # libtbb \
    # libtbb-dev \
    libwebp-dev \
    musl \
    openblas \
    openblas-dev \
    openjpeg-dev \
    openssl \
    tiff-dev \
    zlib-dev

# Build OpenCV
RUN mkdir -p /opt/opencvinstall && \
    cd /opt && \
    wget https://github.com/opencv/opencv/archive/3.4.10.zip && \
    unzip 3.4.10.zip && rm 3.4.10.zip

RUN cd /opt/opencv-3.4.10 && \
    mkdir build && cd build && \
    cmake -D CMAKE_BUILD_TYPE=RELEASE \
    -D CMAKE_C_COMPILER=/usr/bin/clang \
    -D CMAKE_CXX_COMPILER=/usr/bin/clang++ \
    # Don't install to /usr/local so that we can copy opencv sharedobjects to the run stage
    -D CMAKE_INSTALL_PREFIX=/opt/opencvinstall \
    # Build only what we need
    -D BUILD_LIST=core,imgcodecs,imgproc,highgui,videoio,calib3d \
    -D BUILD_EXAMPLES=OFF -D BUILD_opencv_apps=OFF -D BUILD_DOCS=OFF -D BUILD_PERF_TESTS=OFF -D BUILD_TESTS=OFF \
    # Disable OpenEXR, JPEG2000 support, and protobuf
    -D WITH_OPENEXR=OFF -D WITH_JASPER=OFF -D WITH_PROTOBUF=OFF \
    .. && \
    make -j$(nproc) && \
    make install

# needed for node-gyp
RUN apk --no-cache add python

# Install prod dependencies only
COPY package.json package-lock.json ./
RUN OPENCV4NODEJS_DISABLE_AUTOBUILD=1 \
    OPENCV_BIN_DIR=/opt/opencvinstall/bin \
    OPENCV_INCLUDE_DIR=/opt/opencvinstall/include \
    OPENCV_LIB_DIR=/opt/opencvinstall/lib64 \
    npm ci --only=production

COPY src src
COPY data data

###################################
# Production stage
###################################

FROM node:12-alpine

WORKDIR /app

RUN apk --no-cache add \
    # opencv4node
    ffmpeg-libs \
    openblas \
    # gm
    graphicsmagick \
    ghostscript

COPY --from=build /app /app

# maybe lib64 is enough. Why all the headers?
COPY --from=build /opt/opencvinstall /opt/opencvinstall

EXPOSE 8000
CMD node ./src/main.js
